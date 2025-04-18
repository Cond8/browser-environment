// src/features/ollama-api/streaming-logic/infra/retryable-async-generator.ts

/**
 * Error messages
 */
export const JSON_PARSE_ERROR = 'Failed to parse JSON content';
export const MAX_RETRY_ERROR = 'Max retry attempts reached for JSON parsing';

export type RetryableGeneratorOptions = {
  shouldRecover?: (err: unknown) => boolean;
  fallbackValue?: (accumulated: string) => string;
  registerRetryTrigger: (callback: () => void) => () => void; // returns unregister
  maxChunkSize?: number;
};

export async function* retryableAsyncGenerator(
  generatorFactory: () => AsyncGenerator<string, string, unknown>,
  options: RetryableGeneratorOptions & { maxRetries?: number },
): AsyncGenerator<string, string, unknown> {
  /**
   * Enhanced retry logic:
   * - If shouldRecover returns true, fallback is used and generator ends.
   * - If shouldRecover returns false, automatically retry up to maxRetries (default 3).
   * - If max retries are reached, throw the error.
   */
  const {
    shouldRecover = () => false,
    fallbackValue = (acc: string) => acc,
    registerRetryTrigger,
    maxChunkSize = 10_000,
    maxRetries = 3,
  } = options;

  let result: IteratorResult<string, string> | null = null;
  let lastError: unknown = null;
  let accumulatedChunks = '';
  let retryCount = 0;

  const queue: (() => void)[] = [];
  const waitForRetry = () => new Promise<void>(resolve => queue.push(resolve));
  const unregister = registerRetryTrigger(() => {
    const next = queue.shift();
    if (next) next();
  });

  try {
    do {
      const generator = generatorFactory();
      result = null;
      lastError = null;
      accumulatedChunks = '';

      try {
        for await (const chunk of generator) {
          if (!chunk || typeof chunk !== 'string' || !chunk.trim()) {
            yield chunk;
            continue;
          }

          accumulatedChunks += chunk;
          if (accumulatedChunks.length > maxChunkSize) {
            accumulatedChunks = accumulatedChunks.slice(-maxChunkSize);
          }

          yield chunk;
        }

        result = await generator.next();
        if (accumulatedChunks && (!result.value || result.value === '')) {
          result = { done: true, value: fallbackValue(accumulatedChunks) };
        }
      } catch (err) {
        if (shouldRecover(err)) {
          result = { done: true, value: fallbackValue(accumulatedChunks) };
        } else {
          retryCount++;
          if (retryCount > maxRetries) {
            throw err;
          }
          // Automatically trigger retry
          lastError = err;
          // Optionally log retry attempt
          console.warn(`retryableAsyncGenerator: Retry attempt ${retryCount} due to error:`, err);
          // Wait for retry
          await waitForRetry();
        }
      }
    } while (lastError != null && retryCount <= maxRetries);
  } finally {
    unregister();
  }

  if (!result) {
    throw new Error('Generator completed without a result');
  }

  return result.value;
}
