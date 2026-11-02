import { test, expect } from '@playwright/test';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';

test.describe('RAG Chatbot E2E Flow', () => {
  let testDocumentId: string;
  let testUserId: string;

  // Create chunk for testing
  test.beforeAll(async () => {
    // 1. Get user id by email through Service Role
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = userData?.users.find((u) => u.email === TEST_USER_EMAIL);

    if (userError || !testUser) {
      throw new Error(`Failed to fetch test user ID for email: ${TEST_USER_EMAIL}`);
    }
    testUserId = testUser.id;

    // 2. Create document table for testing
    const { data: docData, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: testUserId,
        title: 'E2E Test Document',
        file_path: 'e2e-test-file.txt',
        raw_text:
          'This is a test content for chunking in E2E cloud test. The file name is test.txt.',
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
        content:
          'This is a test content for chunking in E2E cloud test. The file name is test.txt.',
        metadata: { fileName: 'test.txt' },
        embedding: JSON.stringify(new Array(768).fill(0)) as unknown as string,
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
    await inputArea.fill('Which file did I upload?');

    // 4. Click submit btn
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 5. Verify if the queries are displaying in the message container
    const userMessageBubble = page.locator('[data-testid="user-message"]').last();
    await expect(userMessageBubble).toContainText('Which file did I upload?');

    // 6. Wait for streaming response
    // Check if AI response appears
    const aiResponseBubble = page.locator('[data-testid="ai-message"]').last();

    // Ensure getting responses with keywords
    await expect(aiResponseBubble).not.toBeEmpty({ timeout: 15000 });
    await expect(aiResponseBubble).toContainText('test.txt');

    // 7. Verify if Source Badge is rendered
    const sourceBadge = aiResponseBubble.locator('[data-testid="source-badge"]');
    await expect(sourceBadge.first()).toBeVisible();
  });

  // Clean up data after testing done
  test.afterAll(async () => {
    if (testDocumentId) {
      await supabaseAdmin.from('documents').delete().eq('id', testDocumentId);
    }
  });
});
