import { test, expect } from '@playwright/test';

test.describe('Email & Password Authentication Flow', () => {
  test('should show validation error with invalid credentials', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login');

    // 2. Fill in the wrong email and password
    await page.fill('input[type="email"]', 'wrong_user@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123');

    // 3. Click login button
    await page.click('button[type="submit"]');

    // 4. Check out if error messages show
    const errorMessage = page.locator('text=/invalid login credentials|error/i');
    await expect(errorMessage).toBeVisible();
  });

  test('should login successfully and redirect to documents page', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login');

    // 2. Fill in test email and password
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');

    // 3. Click login button and waiting for redirect
    await Promise.all([
      page.waitForURL('**/documents', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    // 4. Check out if it successfully redirect
    expect(page.url()).toContain('/documents');
    const documentsHeading = page.locator('h1:has-text("Knowledge Base")');
    await expect(documentsHeading).toBeVisible();
  });
});
