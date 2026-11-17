import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hermetic tests for POST /api/chat: no network, no Supabase, no Gemini.
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  searchSimilarChunks: vi.fn(),
  generateContentStream: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('@/lib/retrieval', () => ({ searchSimilarChunks: mocks.searchSimilarChunks }));
vi.mock('@/lib/gemini', () => ({
  ai: { models: { generateContentStream: mocks.generateContentStream } },
}));
// Run the callback once, without retries or delays.
vi.mock('@/lib/utils', () => ({
  retryWithBackoff: <T>(fn: () => Promise<T>) => fn(),
}));

import { POST } from '@/app/api/chat/route';

type StreamEvent = Record<string, unknown> & { type: string };

const USER = { id: 'user-1' };
const validBody = { messages: [{ role: 'user', content: 'What is AskMyNotes?' }] };

function chatRequest(body: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function readEvents(res: Response): Promise<StreamEvent[]> {
  const text = await res.text();
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StreamEvent);
}

async function* geminiStream(...texts: string[]) {
  for (const text of texts) yield { text };
}

function makeChunk(id: string, content: string, doc: { title: string; file_path: string }) {
  return { id, content, similarity: 0.9, document_id: doc.file_path, metadata: {}, document: doc };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: USER }, error: null });
  mocks.searchSimilarChunks.mockResolvedValue([]);
  mocks.generateContentStream.mockResolvedValue(geminiStream('ok'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/chat: authentication', () => {
  it('returns 401 when there is no signed-in user', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(chatRequest(validBody));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mocks.searchSimilarChunks).not.toHaveBeenCalled();
    expect(mocks.generateContentStream).not.toHaveBeenCalled();
  });

  it('returns 401 when Supabase reports an auth error', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error('jwt expired') });

    const res = await POST(chatRequest(validBody));

    expect(res.status).toBe(401);
    expect(mocks.searchSimilarChunks).not.toHaveBeenCalled();
  });
});

describe('POST /api/chat: input validation', () => {
  const invalidBodies: [string, unknown][] = [
    ['a body without messages', {}],
    ['messages that is not an array', { messages: 'hello' }],
    ['an empty messages array', { messages: [] }],
    ['an unknown role', { messages: [{ role: 'system', content: 'hi' }] }],
    ['empty content', { messages: [{ role: 'user', content: '' }] }],
    ['a message without content', { messages: [{ role: 'user' }] }],
  ];

  it.each(invalidBodies)('returns 400 for %s', async (_name, body) => {
    const res = await POST(chatRequest(body));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: expect.any(String) });
    expect(mocks.searchSimilarChunks).not.toHaveBeenCalled();
    expect(mocks.generateContentStream).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is not valid JSON', async () => {
    const res = await POST(chatRequest('{not json'));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid request body' });
  });
});

describe('POST /api/chat: streaming response', () => {
  it('streams status, sources, and text events as NDJSON', async () => {
    mocks.searchSimilarChunks.mockResolvedValue([
      makeChunk('c1', 'AskMyNotes is a RAG app.', {
        title: 'notes.md',
        file_path: 'user-1/notes.md',
      }),
      makeChunk('c2', 'It uses pgvector.', { title: 'notes.md', file_path: 'user-1/notes.md' }),
      makeChunk('c3', 'Unrelated text.', { title: 'other.txt', file_path: 'user-1/other.txt' }),
    ]);
    mocks.generateContentStream.mockResolvedValue(geminiStream('Hello ', 'world [Source 1]'));

    const res = await POST(chatRequest(validBody));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/x-ndjson');

    const events = await readEvents(res);
    expect(events.map((e) => e.type)).toEqual(['status', 'sources', 'status', 'text', 'text']);
    expect(events[0]).toEqual({ type: 'status', status: 'searching' });
    expect(events[2]).toEqual({ type: 'status', status: 'generating' });

    const text = events
      .filter((e) => e.type === 'text')
      .map((e) => e.text)
      .join('');
    expect(text).toBe('Hello world [Source 1]');
  });

  it('merges chunks from the same document into one source', async () => {
    mocks.searchSimilarChunks.mockResolvedValue([
      makeChunk('c1', 'First excerpt.', { title: 'notes.md', file_path: 'user-1/notes.md' }),
      makeChunk('c2', 'Second excerpt.', { title: 'notes.md', file_path: 'user-1/notes.md' }),
      makeChunk('c3', 'Other doc.', { title: 'other.txt', file_path: 'user-1/other.txt' }),
    ]);

    const events = await readEvents(await POST(chatRequest(validBody)));
    const sources = events.find((e) => e.type === 'sources')?.sources as {
      title: string;
      content: string;
    }[];

    expect(sources).toHaveLength(2);
    expect(sources[0].title).toBe('notes.md');
    expect(sources[0].content).toContain('First excerpt.');
    expect(sources[0].content).toContain('Second excerpt.');
    expect(sources[1].title).toBe('other.txt');
  });

  it('searches with the latest message and sends the whole history to Gemini', async () => {
    const messages = [
      { role: 'user', content: 'first question' },
      { role: 'model', content: 'first answer' },
      { role: 'user', content: 'follow-up question' },
    ];

    await readEvents(await POST(chatRequest({ messages })));

    expect(mocks.searchSimilarChunks).toHaveBeenCalledWith('follow-up question', 4, 0.4);
    const request = mocks.generateContentStream.mock.calls[0][0];
    expect(request.contents).toEqual([
      { role: 'user', parts: [{ text: 'first question' }] },
      { role: 'model', parts: [{ text: 'first answer' }] },
      { role: 'user', parts: [{ text: 'follow-up question' }] },
    ]);
  });

  it('puts the retrieved context into the system instruction', async () => {
    mocks.searchSimilarChunks.mockResolvedValue([
      makeChunk('c1', 'Context about pgvector.', {
        title: 'notes.md',
        file_path: 'user-1/notes.md',
      }),
    ]);

    await readEvents(await POST(chatRequest(validBody)));

    const { systemInstruction } = mocks.generateContentStream.mock.calls[0][0].config;
    expect(systemInstruction).toContain('[Source 1] (Document Title: notes.md)');
    expect(systemInstruction).toContain('Context about pgvector.');
  });

  it('tells the model that no context was found when retrieval returns nothing', async () => {
    const events = await readEvents(await POST(chatRequest(validBody)));

    expect(events.find((e) => e.type === 'sources')?.sources).toEqual([]);
    const { systemInstruction } = mocks.generateContentStream.mock.calls[0][0].config;
    expect(systemInstruction).toContain('No relevant context found.');
  });
});

describe('POST /api/chat: error handling', () => {
  it('sends a generic error event when retrieval fails, without leaking internals', async () => {
    mocks.searchSimilarChunks.mockRejectedValue(
      new Error('relation "document_chunks" does not exist')
    );

    const res = await POST(chatRequest(validBody));
    const raw = await res.clone().text();
    const events = await readEvents(res);

    expect(events.at(-1)).toEqual({ type: 'error', message: 'Internal Server Error' });
    expect(raw).not.toContain('document_chunks');
    expect(mocks.generateContentStream).not.toHaveBeenCalled();
  });

  it('sends a generic error event when Gemini fails, after the sources were sent', async () => {
    mocks.generateContentStream.mockRejectedValue(new Error('503 UNAVAILABLE: model overloaded'));

    const res = await POST(chatRequest(validBody));
    const raw = await res.clone().text();
    const events = await readEvents(res);
    const types = events.map((e) => e.type);

    expect(types).toContain('sources');
    expect(types).not.toContain('text');
    expect(events.at(-1)).toEqual({ type: 'error', message: 'Internal Server Error' });
    expect(raw).not.toContain('503');
  });
});
