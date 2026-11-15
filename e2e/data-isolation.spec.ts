import { test, expect, type Page } from '@playwright/test';

async function deleteDocumentByName(page: Page, fileName: string) {
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/documents');

  const card = page
    .locator('[data-testid^="card-"]')
    .filter({ has: page.getByTestId('doc-title').filter({ hasText: fileName }) });

  if ((await card.count()) === 0) return;

  await card.locator('[data-testid$="-delete-btn"]').click();

  await expect(card).toHaveCount(0);
}

test.describe('Multi-tenant Data Isolation', () => {
  test('User A cannot see documents uploaded by User B', async ({ browser }, testInfo) => {
    // get baseURL from config
    const baseURL = testInfo.project.use.baseURL;
    const fileName = `secret-b-${testInfo.project.name}-${Date.now()}.txt`;
    // ---------------------------------------------------------
    // Step 1：Prepare User A browser context
    // ---------------------------------------------------------
    const contextA = await browser.newContext({
      baseURL,
      storageState: 'e2e/.auth/user.json', // User A Session
    });
    const pageA = await contextA.newPage();

    // ---------------------------------------------------------
    // Step 2：Prepare User B browser context（simulate another account）
    // ---------------------------------------------------------
    const contextB = await browser.newContext({
      baseURL,
      storageState: 'e2e/.auth/userB.json',
    });
    const pageB = await contextB.newPage();
    try {
      // ---------------------------------------------------------
      // Step 3：User B upload file
      // ---------------------------------------------------------
      await pageB.goto('/upload');
      await expect(pageB.locator('input[type="file"]')).toBeAttached();

      await pageB.setInputFiles('input[type="file"]', {
        name: fileName,
        mimeType: 'text/plain',
        buffer: Buffer.from('This is confidential data belonging strictly to User B.'),
      });

      // Click upload button
      await pageB.getByRole('button', { name: /Upload your file/i }).click();
      await expect(pageB.getByText('File uploaded successfully!')).toBeVisible();

      await pageB.goto('/documents');
      await expect(pageB.getByText(fileName)).toBeVisible();

      // ---------------------------------------------------------
      // Step 5：Switch back to User A and check if User A can view User B's file
      // ---------------------------------------------------------
      await pageA.goto('/documents');

      // Check out User B's file does not appear in User A's documents list
      await expect(pageA.locator('h1:has-text("Knowledge Base")')).toBeVisible();
      await expect(pageA.getByText(fileName)).toHaveCount(0);
    } finally {
      try {
        await deleteDocumentByName(pageB, fileName);
      } catch (e) {
        console.warn(`Fail to delete file: ${fileName}`, e);
      }
      // ---------------------------------------------------------
      // Clear Context
      // ---------------------------------------------------------
      await contextA.close();
      await contextB.close();
    }
  });
});
