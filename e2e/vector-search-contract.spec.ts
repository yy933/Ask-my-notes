import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Contract test for the `match_documents` SQL function against the Supabase test project.
// It uses small hand-made vectors, so it is deterministic and does not call Gemini.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userAEmail = process.env.TEST_USER_EMAIL;
const userBEmail = process.env.TEST_USER_B_EMAIL;

if (!supabaseUrl || !serviceKey || !userAEmail || !userBEmail) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL and TEST_USER_B_EMAIL must be set'
  );
}

const admin = createClient(supabaseUrl, serviceKey);

const DIMENSIONS = 768; // must match vector(768)
const runId = Date.now();

// A unit vector that only uses the first two dimensions, so cosine similarities are easy to reason about.
function vector(x: number, y: number): number[] {
  const norm = Math.hypot(x, y);
  const values = new Array<number>(DIMENSIONS).fill(0);
  values[0] = x / norm;
  values[1] = y / norm;
  return values;
}

async function userIdByEmail(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(`Failed to list users: ${error.message}`);
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`Test user ${email} does not exist in the test project`);
  return user.id;
}

async function seedDocument(
  userId: string,
  label: string,
  chunks: { content: string; embedding: number[] }[]
): Promise<string> {
  const { data: doc, error: docError } = await admin
    .from('documents')
    .insert({
      user_id: userId,
      title: `vector-contract-${runId}-${label}`,
      file_path: `vector-contract-${runId}-${label}.txt`,
      raw_text: 'vector contract test',
      status: 'completed',
    })
    .select()
    .single();
  if (docError) throw docError;

  const { error: chunkError } = await admin.from('document_chunks').insert(
    chunks.map((chunk) => ({
      user_id: userId,
      document_id: doc.id,
      content: chunk.content,
      metadata: { fileName: `vector-contract-${runId}-${label}.txt` },
      embedding: JSON.stringify(chunk.embedding) as unknown as string,
    }))
  );
  if (chunkError) throw chunkError;

  return doc.id;
}

async function search(userId: string, matchCount: number, threshold: number) {
  const { data, error } = await admin.rpc('match_documents', {
    query_embedding: JSON.stringify(vector(1, 0)),
    match_count: matchCount,
    match_threshold: threshold,
    filter_user_id: userId,
  });
  expect(error).toBeNull();
  return (data ?? []) as { content: string; similarity: number }[];
}

test.describe('match_documents SQL function', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Database contract test: run once');
  test.describe.configure({ mode: 'serial' });

  let userAId: string;
  let userBId: string;
  const documentIds: string[] = [];

  test.beforeAll(async () => {
    userAId = await userIdByEmail(userAEmail);
    userBId = await userIdByEmail(userBEmail);

    // Query vector is (1, 0): cosine similarity is 1 for "exact", about 0.98 for "near", 0 for "far".
    documentIds.push(
      await seedDocument(userAId, 'a', [
        { content: 'far', embedding: vector(0, 1) },
        { content: 'exact', embedding: vector(1, 0) },
        { content: 'near', embedding: vector(1, 0.2) },
      ])
    );
    // Same best-match vector, but owned by another user.
    documentIds.push(
      await seedDocument(userBId, 'b', [{ content: 'other-user', embedding: vector(1, 0) }])
    );
  });

  test.afterAll(async () => {
    if (documentIds.length === 0) return;
    await admin.from('document_chunks').delete().in('document_id', documentIds);
    await admin.from('documents').delete().in('id', documentIds);
  });

  test('returns matches above the threshold, best first, and drops weaker ones', async () => {
    const results = await search(userAId, 5, 0.5);

    expect(results.map((r) => r.content)).toEqual(['exact', 'near']);
    const similarities = results.map((r) => r.similarity);
    expect(similarities).toEqual([...similarities].sort((a, b) => b - a));
  });

  test('never returns more rows than requested', async () => {
    const results = await search(userAId, 1, 0.5);

    expect(results.map((r) => r.content)).toEqual(['exact']);
  });

  test("only returns the requested user's chunks", async () => {
    const forA = await search(userAId, 10, 0);
    const forB = await search(userBId, 10, 0);

    expect(forA.map((r) => r.content)).not.toContain('other-user');
    expect(forB.map((r) => r.content)).toEqual(['other-user']);
  });
});
