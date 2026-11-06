import { test, expect, type Page } from '@playwright/test';

type StreamEvent =
  | { type: 'status'; status: 'searching' | 'generating' }
  | { type: 'sources'; sources: unknown[] }
  | { type: 'text'; text: string }
  | { type: 'error'; message: string };

const MOCK_SOURCES = [
  {
    id: 'chunk-1',
    title: 'Mock Document',
    chunkIndex: 1,
    content: 'This is the mocked chunk content.',
    file_path: 'mock-file.txt',
  },
];

async function mockChatApi(page: Page, events: StreamEvent[], delayMs = 0) {
  await page.route('**/api/chat', async (route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson; charset=utf-8',
      body: events.map((e) => JSON.stringify(e)).join('\n') + '\n',
    });
  });
}

async function ask(page: Page, question: string) {
  await page.goto('/chat');
  const textarea = page.locator('textarea[name="userMessage"]');
  const submit = page.locator('button[type="submit"]');

  await expect(textarea).toBeVisible();
  await textarea.fill(question);

  //  Input clear after hydration , and button become disabled. Refill input.
  await expect(async () => {
    if (!(await submit.isEnabled())) {
      await textarea.fill(question);
    }
    await expect(submit).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 10000 });

  await submit.click();
}

test.describe('Chat UI (mocked API)', () => {
  test('shows user message immediately and thinking state while waiting', async ({ page }) => {
    await mockChatApi(
      page,
      [
        { type: 'sources', sources: MOCK_SOURCES },
        { type: 'text', text: 'The file is mock-file.txt [Source 1]' },
      ],
      1500
    );

    await ask(page, 'What is the file name?');

    await expect(page.locator('[data-testid="user-message"]').last()).toContainText(
      'What is the file name?'
    );
    const ai = page.locator('[data-testid="ai-message"]').last();
    await expect(ai).toContainText('Searching notes');

    await expect(ai).toContainText('mock-file.txt');
    await expect(ai).not.toContainText('Searching notes');
  });

  test('renders source badge from [Source N] marker', async ({ page }) => {
    await mockChatApi(page, [
      { type: 'sources', sources: MOCK_SOURCES },
      { type: 'text', text: 'Answer from the document [Source 1]' },
    ]);

    await ask(page, 'Any question');

    const badge = page
      .locator('[data-testid="ai-message"]')
      .last()
      .locator('[data-testid="source-badge"]');
    await expect(badge.first()).toBeVisible();
  });

  test('accumulates multiple text chunks into one answer', async ({ page }) => {
    await mockChatApi(page, [
      { type: 'sources', sources: MOCK_SOURCES },
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'streaming ' },
      { type: 'text', text: 'world [Source 1]' },
    ]);

    await ask(page, 'Say hello');

    await expect(page.locator('[data-testid="ai-message"]').last()).toContainText(
      'Hello streaming world'
    );
  });

  test('shows error message when stream returns an error event', async ({ page }) => {
    await mockChatApi(page, [{ type: 'error', message: 'Gemini 503' }]);

    await ask(page, 'Any question');

    await expect(page.locator('[data-testid="ai-message"]').last()).toContainText(
      'An error occurred'
    );
  });

  test('shows error message when API returns HTTP 500', async ({ page }) => {
    await page.route('**/api/chat', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"x"}' })
    );

    await ask(page, 'Any question');

    await expect(page.locator('[data-testid="ai-message"]').last()).toContainText(
      'An error occurred'
    );
  });
});
