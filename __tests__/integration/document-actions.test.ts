import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';

// Hermetic tests for the document Server Actions: Supabase, Gemini, and the PDF parser are mocked.
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  storageUpload: vi.fn(),
  storageRemove: vi.fn(),
  embedContent: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
    storage: { from: () => ({ upload: mocks.storageUpload, remove: mocks.storageRemove }) },
  }),
}));
vi.mock('@/lib/gemini', () => ({ ai: { models: { embedContent: mocks.embedContent } } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('pdf-parse', () => ({
  PDFParse: class {
    async getText() {
      return { text: 'text extracted from pdf' };
    }
    async destroy() {}
  },
}));

import { uploadDocument, buildDocumentIndex, deleteDocuments } from '@/app/actions/upload';

const USER = { id: 'user-1' };

// A chainable, awaitable stand-in for a Supabase query builder.
interface QueryResult {
  data?: unknown;
  error?: { message: string } | null;
}
interface Builder {
  select: Mock;
  insert: Mock;
  update: Mock;
  delete: Mock;
  eq: Mock;
  in: Mock;
  single: Mock;
}
function builder(result: QueryResult): Builder {
  const b: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'single']) {
    b[method] = vi.fn(() => b);
  }
  b.then = (resolve: (value: QueryResult) => unknown) => resolve(result);
  return b as unknown as Builder;
}

function tables(map: Record<string, Builder>) {
  mocks.from.mockImplementation((table: string) => {
    const b = map[table];
    if (!b) throw new Error(`Unexpected table: ${table}`);
    return b;
  });
}

function formWith(file?: File): FormData {
  const formData = new FormData();
  if (file) formData.append('file', file);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: USER }, error: null });
  mocks.storageUpload.mockResolvedValue({ data: { path: 'user-1/stored.txt' }, error: null });
  mocks.storageRemove.mockResolvedValue({ error: null });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('uploadDocument', () => {
  it('rejects unauthenticated users', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await uploadDocument(null, formWith(new File(['hello'], 'notes.txt')));

    expect(result.success).toBe(false);
    expect(mocks.storageUpload).not.toHaveBeenCalled();
  });

  it('rejects a request without a file', async () => {
    const result = await uploadDocument(null, formWith());

    expect(result).toEqual({ success: false, message: 'No file provided.' });
  });

  describe('rejects invalid files before touching storage or the database', () => {
    const bigFile = new File([new Uint8Array(3 * 1024 * 1024 + 1).fill(97)], 'big.txt');
    const invalidFiles: [string, File][] = [
      ['a file over 3 MB', bigFile],
      ['an unsupported extension', new File(['MZ binary'], 'tool.exe')],
      ['a .pdf file without the PDF header', new File(['plain text'], 'fake.pdf')],
      ['a text file with invalid UTF-8', new File([new Uint8Array([0xff, 0xfe, 0xfd])], 'bad.txt')],
      ['a text file with only whitespace', new File([' \n\t '], 'blank.txt')],
    ];

    it.each(invalidFiles)('%s', async (_name, file) => {
      const result = await uploadDocument(null, formWith(file));

      expect(result.success).toBe(false);
      expect(mocks.storageUpload).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
    });
  });

  it('stores a text file under the user folder and creates a pending document', async () => {
    const documents = builder({ data: { id: 'doc-1' }, error: null });
    tables({ documents });

    const result = await uploadDocument(
      null,
      formWith(new File(['hello world'], 'notes.txt', { type: 'text/plain' }))
    );

    expect(result).toMatchObject({ success: true, documentId: 'doc-1' });
    expect(mocks.storageUpload.mock.calls[0][0]).toMatch(/^user-1\/\d+_[a-z0-9]+\.txt$/);
    expect(documents.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        title: 'notes.txt',
        file_path: 'user-1/stored.txt',
        raw_text: 'hello world',
        status: 'pending',
      })
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/documents');
  });

  it('extracts text from a PDF that has a valid header', async () => {
    const documents = builder({ data: { id: 'doc-2' }, error: null });
    tables({ documents });

    const result = await uploadDocument(
      null,
      formWith(new File(['%PDF-1.4 fake body'], 'paper.pdf', { type: 'application/pdf' }))
    );

    expect(result).toMatchObject({ success: true, documentId: 'doc-2' });
    expect(documents.insert).toHaveBeenCalledWith(
      expect.objectContaining({ raw_text: 'text extracted from pdf' })
    );
  });

  it('does not create a record when the storage upload fails', async () => {
    mocks.storageUpload.mockResolvedValue({ data: null, error: { message: 'storage down' } });
    const documents = builder({ data: { id: 'doc-1' }, error: null });
    tables({ documents });

    const result = await uploadDocument(null, formWith(new File(['hello'], 'notes.txt')));

    expect(result.success).toBe(false);
    expect(documents.insert).not.toHaveBeenCalled();
    expect(mocks.storageRemove).not.toHaveBeenCalled();
  });

  it('removes the uploaded file when the database insert fails', async () => {
    const documents = builder({ data: null, error: { message: 'insert failed' } });
    tables({ documents });

    const result = await uploadDocument(null, formWith(new File(['hello'], 'notes.txt')));

    expect(result.success).toBe(false);
    expect(mocks.storageRemove).toHaveBeenCalledWith(['user-1/stored.txt']);
  });
});

describe('buildDocumentIndex', () => {
  it('rejects unauthenticated users', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await buildDocumentIndex('doc-1');

    expect(result.success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("refuses to index another user's document", async () => {
    const documents = builder({
      data: { id: 'doc-1', title: 'x.txt', raw_text: 'secret', user_id: 'someone-else' },
      error: null,
    });
    const chunks = builder({ error: null });
    tables({ documents, document_chunks: chunks });

    const result = await buildDocumentIndex('doc-1');

    expect(result.success).toBe(false);
    expect(mocks.embedContent).not.toHaveBeenCalled();
    expect(chunks.insert).not.toHaveBeenCalled();
  });

  it('embeds the chunks, stores them, and marks the document completed', async () => {
    const documents = builder({
      data: { id: 'doc-1', title: 'notes.txt', raw_text: 'short text', user_id: 'user-1' },
      error: null,
    });
    const chunks = builder({ error: null });
    tables({ documents, document_chunks: chunks });
    mocks.embedContent.mockResolvedValue({ embeddings: [{ values: [0.1, 0.2] }] });

    const result = await buildDocumentIndex('doc-1');

    expect(result.success).toBe(true);
    expect(mocks.embedContent).toHaveBeenCalledTimes(1);
    expect(mocks.embedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-embedding-001',
        contents: 'short text',
        config: { outputDimensionality: 768, taskType: 'RETRIEVAL_DOCUMENT' },
      })
    );
    expect(chunks.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        document_id: 'doc-1',
        content: 'short text',
        embedding: JSON.stringify([0.1, 0.2]),
      }),
    ]);
    expect(documents.update).toHaveBeenCalledWith({ status: 'completed' });
  });

  it('marks the document as failed when embedding fails', async () => {
    const documents = builder({
      data: { id: 'doc-1', title: 'notes.txt', raw_text: 'short text', user_id: 'user-1' },
      error: null,
    });
    const chunks = builder({ error: null });
    tables({ documents, document_chunks: chunks });
    mocks.embedContent.mockResolvedValue({ embeddings: [] });

    const result = await buildDocumentIndex('doc-1');

    expect(result.success).toBe(false);
    expect(chunks.insert).not.toHaveBeenCalled();
    expect(documents.update).toHaveBeenCalledWith({ status: 'failed' });
  });
});

describe('deleteDocuments', () => {
  it('rejects unauthenticated users', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await deleteDocuments(['d1']);

    expect(result.success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('rejects an empty id list', async () => {
    const result = await deleteDocuments([]);

    expect(result).toEqual({ success: false, message: 'No documents specified for deletion.' });
  });

  it('deletes nothing if any document belongs to someone else', async () => {
    const documents = builder({
      data: [
        { id: 'd1', user_id: 'user-1', file_path: 'user-1/a.txt' },
        { id: 'd2', user_id: 'someone-else', file_path: 'someone-else/b.txt' },
      ],
      error: null,
    });
    tables({ documents });

    const result = await deleteDocuments(['d1', 'd2']);

    expect(result.success).toBe(false);
    expect(mocks.storageRemove).not.toHaveBeenCalled();
    expect(documents.delete).not.toHaveBeenCalled();
  });

  it('removes the files and rows of documents the user owns', async () => {
    const documents = builder({
      data: [
        { id: 'd1', user_id: 'user-1', file_path: 'user-1/a.txt' },
        { id: 'd2', user_id: 'user-1', file_path: 'user-1/b.txt' },
      ],
      error: null,
    });
    tables({ documents });

    const result = await deleteDocuments(['d1', 'd2']);

    expect(result.success).toBe(true);
    expect(mocks.storageRemove).toHaveBeenCalledWith(['user-1/a.txt', 'user-1/b.txt']);
    expect(documents.delete).toHaveBeenCalled();
    expect(documents.in).toHaveBeenCalledWith('id', ['d1', 'd2']);
    expect(documents.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
