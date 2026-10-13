import { describe, it, expect } from 'vitest';

describe('Chat API Integration Test', () => {
  it('should successfully receive messages and return streaming response', async () => {
    // send a POST request to the chat API endpoint with a test message
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test message: Is the system working correctly?' }],
      }),
    });

    // 1. Verify HTTP status and response body
    expect(response.status).toBe(200);
    expect(response.body).not.toBeNull();

    // 2. Read streaming content
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let resultText = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
      }
    }

    // 3. Verify that AI-generated text was successfully received
    expect(resultText.length).toBeGreaterThan(0);
  }, 30000); // Give a longer timeout period to wait for LLM response
});
