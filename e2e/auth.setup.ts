import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 1. Go to login page
  await page.goto('/login');

  // 2. Fill in email and password for tests
  await page.locator('input[name="email"]').fill(process.env.TEST_USER_EMAIL || 'test@example.com');
  await page
    .locator('input[name="password"]')
    .fill(process.env.TEST_USER_PASSWORD || 'password123');

  // 3. Click login button
  await page.locator('button[type="submit"]').click();

  // 4. Once login successfully, redirect to /documents
  await page.waitForURL('/documents');

  // 5. Ensure the page contains /documents
  await expect(page).toHaveURL('/documents');

  // 6. Save current state（including Supabase Auth Cookies）
  await page.context().storageState({ path: authFile });
});
