import { test, expect } from '@playwright/test';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function embed(text: string): Promise<number[]> {
  const res = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: { outputDimensionality: 768, taskType: 'RETRIEVAL_DOCUMENT' },
  });
  const values = res.embeddings?.[0]?.values;
  if (!values) throw new Error('Failed to generate embedding');
  return values;
}
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

test.describe('RAG Chatbot E2E Flow (real Gemini)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Real API smoke test: chromium only');
  let testDocumentId: string;
  let testUserId: string;
  let uniqueFileName: string;

  // Create chunk for testing
  test.beforeEach(async ({}, testInfo) => {
    uniqueFileName = `e2e-${testInfo.project.name}-${Date.now()}.txt`;
    const content = `This is a test content for chunking in E2E cloud test. The file name is ${uniqueFileName}.`;
    // 1. Get user id by email through Service Role
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`);
    }
    let testUser = userData?.users.find((u) => u.email === TEST_USER_EMAIL);

    // if test user doesn't exist, create one
    if (!testUser) {
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true, // confirm email automatically
      });

      if (createError || !createData.user) {
        throw new Error(`Failed to create test user: ${createError?.message}`);
      }
      testUser = createData.user;
    }

    testUserId = testUser.id;

    // 2. Create document table for testing
    const { data: docData, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: testUserId,
        title: `E2E Test Document ${uniqueFileName}`,
        file_path: uniqueFileName,
        raw_text: content,
        status: 'completed',
      })
      .select()
      .single();

    if (docError) throw docError;
    testDocumentId = docData.id;

    // 3. Create chunks
    const { error: chunkError } = await supabaseAdmin
      .from('document_chunks')
      .insert({
        user_id: testUserId,
        document_id: testDocumentId,
        content,
        metadata: { fileName: uniqueFileName },
        embedding: JSON.stringify(await embed(content)) as unknown as string,
      })
      .select()
      .single();

    if (chunkError) throw chunkError;
  });

  test('should send a message, receive streaming response, and show source badges', async ({
    page,
  }) => {
    // 1. Navigate to chat page
    await page.goto('/chat');

    // 2. Check title and initial condition
    await expect(page.getByTestId('chat-header')).toBeVisible();

    // 3. Add queries in Textarea
    const inputArea = page.locator('textarea[name="userMessage"]');
    await inputArea.fill('What is the file name?');

    // 4. Click submit btn
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 5. Verify if the queries are displaying in the message container
    const userMessageBubble = page.locator('[data-testid="user-message"]').last();
    await expect(userMessageBubble).toContainText('What is the file name?');

    // 6. Wait for streaming response
    // Check if AI response appears
    const aiResponseBubble = page.locator('[data-testid="ai-message"]').last();

    // Ensure getting responses with keywords
    await expect(aiResponseBubble).toContainText(uniqueFileName);

    // 7. Verify if Source Badge is rendered
    const sourceBadge = aiResponseBubble.locator('[data-testid="source-badge"]');
    await expect(sourceBadge.first()).toBeVisible();
  });

  // Clean up data after testing done
  test.afterEach(async () => {
    if (testDocumentId) {
      await supabaseAdmin.from('document_chunks').delete().eq('document_id', testDocumentId);
      await supabaseAdmin.from('documents').delete().eq('id', testDocumentId);
    }
  });
});
