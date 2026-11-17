import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hermetic tests for searchSimilarChunks: Supabase and Gemini are mocked.
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  docsIn: vi.fn(),
  embedContent: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
    from: mocks.from,
  }),
}));
vi.mock('@/lib/gemini', () => ({
  ai: { models: { embedContent: mocks.embedContent } },
}));

import { searchSimilarChunks } from '@/lib/retrieval';

const USER = { id: 'user-1' };

function row(id: string, documentId: string, similarity: number, metadata = {}) {
  return { id, document_id: documentId, content: `content ${id}`, similarity, metadata };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: USER } });
  mocks.embedContent.mockResolvedValue({ embeddings: [{ values: [0.1, 0.2, 0.3] }] });
  mocks.rpc.mockResolvedValue({ data: [], error: null });
  mocks.from.mockReturnValue({ select: () => ({ in: mocks.docsIn }) });
  mocks.docsIn.mockResolvedValue({ data: [] });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('searchSimilarChunks', () => {
  it('throws Unauthorized when there is no signed-in user', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(searchSimilarChunks('anything')).rejects.toThrow('Unauthorized');
    expect(mocks.embedContent).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each(['', '   ', '\n\t'])(
    'returns [] for the blank query %j without any external call',
    async (query) => {
      await expect(searchSimilarChunks(query)).resolves.toEqual([]);

      expect(mocks.embedContent).not.toHaveBeenCalled();
      expect(mocks.rpc).not.toHaveBeenCalled();
    }
  );

  it('embeds the trimmed query as a retrieval query with 768 dimensions', async () => {
    await searchSimilarChunks('  What is AskMyNotes?  ');

    expect(mocks.embedContent).toHaveBeenCalledWith({
      model: 'gemini-embedding-001',
      contents: 'What is AskMyNotes?',
      config: { outputDimensionality: 768, taskType: 'RETRIEVAL_QUERY' },
    });
  });

  it('scopes the vector search to the current user', async () => {
    await searchSimilarChunks('question', 3, 0.6);

    expect(mocks.rpc).toHaveBeenCalledWith('match_documents', {
      query_embedding: JSON.stringify([0.1, 0.2, 0.3]),
      match_count: 3,
      match_threshold: 0.6,
      filter_user_id: 'user-1',
    });
  });

  it('uses 5 results and a 0.3 threshold by default', async () => {
    await searchSimilarChunks('question');

    expect(mocks.rpc).toHaveBeenCalledWith(
      'match_documents',
      expect.objectContaining({ match_count: 5, match_threshold: 0.3 })
    );
  });

  it('returns [] and skips the document lookup when nothing matches', async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    await expect(searchSimilarChunks('question')).resolves.toEqual([]);

    mocks.rpc.mockResolvedValue({ data: null, error: null });
    await expect(searchSimilarChunks('question')).resolves.toEqual([]);

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('attaches document title and path to each chunk', async () => {
    mocks.rpc.mockResolvedValue({ data: [row('c1', 'd1', 0.9)], error: null });
    mocks.docsIn.mockResolvedValue({
      data: [{ id: 'd1', title: 'notes.md', file_path: 'user-1/notes.md' }],
    });

    const results = await searchSimilarChunks('question');

    expect(mocks.from).toHaveBeenCalledWith('documents');
    expect(results).toHaveLength(1);
    expect(results[0].document).toEqual({ title: 'notes.md', file_path: 'user-1/notes.md' });
  });

  it('looks up each document once', async () => {
    mocks.rpc.mockResolvedValue({
      data: [row('c1', 'd1', 0.9), row('c2', 'd1', 0.8), row('c3', 'd2', 0.7)],
      error: null,
    });

    await searchSimilarChunks('question');

    expect(mocks.docsIn).toHaveBeenCalledWith('id', ['d1', 'd2']);
  });

  it('falls back to the chunk metadata, then to a placeholder, when the document is missing', async () => {
    mocks.rpc.mockResolvedValue({
      data: [row('c1', 'd1', 0.9, { fileName: 'from-metadata.txt' }), row('c2', 'd2', 0.8)],
      error: null,
    });
    mocks.docsIn.mockResolvedValue({ data: [] });

    const results = await searchSimilarChunks('question');

    expect(results[0].document).toEqual({ title: 'from-metadata.txt', file_path: null });
    expect(results[1].document).toEqual({ title: 'Untitled Document', file_path: null });
  });

  it('keeps the order returned by the database', async () => {
    mocks.rpc.mockResolvedValue({
      data: [row('c1', 'd1', 0.9), row('c2', 'd1', 0.7), row('c3', 'd1', 0.5)],
      error: null,
    });

    const results = await searchSimilarChunks('question');

    expect(results.map((r) => r.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('throws a descriptive error when the vector search fails', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } });

    await expect(searchSimilarChunks('question')).rejects.toThrow(
      'Vector search failed: function does not exist'
    );
  });

  it('throws when Gemini returns no embedding', async () => {
    mocks.embedContent.mockResolvedValue({ embeddings: [] });

    await expect(searchSimilarChunks('question')).rejects.toThrow(
      'Failed to generate embedding for the query.'
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
