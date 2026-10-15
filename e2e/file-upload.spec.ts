import { test, expect } from '@playwright/test';

test('Users can upload files', async ({ page }) => {
  // 1. Navigate to the file upload page
  await page.goto('http://localhost:3000');

  // 2. Select the file upload input and upload the test file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'test.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('This is a test content for chunking.'),
  });

  // 3. Click the submit button
  await page.getByRole('button', { name: /Upload your file/i }).click();

  // 4. Verify that the upload success message is displayed
  await expect(page.getByText(/Successfully processed/i)).toBeVisible({ timeout: 15000 });
});
