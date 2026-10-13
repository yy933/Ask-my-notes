export { cn } from 'cn';

// retryWithBackoff is a utility function that retries a given asynchronous function with exponential backoff in case of specific errors (like 503 Service Unavailable).
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    // 1. trying to execute the provided asynchronous function
    return await fn();
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    // 2. Check if the error is a 503 Service Unavailable or contains 'UNAVAILABLE' in its message, and if there are remaining retries
    if ((err?.status === 503 || err?.message?.includes('UNAVAILABLE')) && retries > 0) {
      console.warn(`Traffic spike (503): Retrying in ${delay}ms  (remaining attempts: ${retries})`);
      // 3. Wait for the specified delay before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      // 4. Retry the function with decremented retries and increased delay (exponential backoff)
      return retryWithBackoff(fn, retries - 1, delay * 2); // delay times double (Exponential Backoff)
    }
    // 5. If the error is not a 503 or there are no remaining retries, rethrow the error to be handled by the caller
    throw error;
  }
}
