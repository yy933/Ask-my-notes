import { test, expect } from '@playwright/test';
import { supabase } from '@/lib/supabase';

test.describe('RAG Chatbot E2E Flow', () => {
  let testDocumentId: string;

  // Create chunk for testing
  test.beforeAll(async () => {
    // Create document table for testing
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: 'E2E Test Document',
        file_path: 'e2e-test-file.txt',
      })
      .select()
      .single();

    if (docError) throw docError;
    testDocumentId = docData.id;

    const { error: chunkError } = await supabase
      .from('document_chunks')
      .insert({
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
    await expect(page.locator('h1')).toHaveText('Ask My Notes');

    // 3. Add queries in Textarea
    const inputArea = page.locator('textarea[name="userMessage"]');
    await inputArea.fill('請問我上傳了什麼檔案？');

    // 4. Click submit btn
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 5. Verify if the queries are displaying in the message container
    const userMessageBubble = page.locator('[data-testid="user-message"]').last();
    await expect(userMessageBubble).toContainText('請問我上傳了什麼檔案？');

    // 6. Wait for streaming response
    // Check if AI response appears
    const aiResponseBubble = page.locator('[data-testid="ai-message"]').last();

    // Ensure getting responses with keywords
    await expect(aiResponseBubble).not.toBeEmpty({ timeout: 15000 });
    await expect(aiResponseBubble).toContainText('test.txt');

    // 7. Verify if Source Badge is rendered
    const sourceBadge = aiResponseBubble.locator('span', { hasText: 'Source' });
    await expect(sourceBadge.first()).toBeVisible();
  });

  // Clean up data after testing done
  test.afterAll(async () => {
    if (testDocumentId) {
      await supabase.from('documents').delete().eq('id', testDocumentId);
    }
  });
});
