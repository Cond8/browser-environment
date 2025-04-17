// src/features/ollama-api/streaming-logic/infra/retryable-async-generator.ts
import { StreamingAssistantMessage } from '@/features/chat/models/streaming-assistant-message';
import { useRetryEventBusStore } from '../../stores/retry-event-bus-store';
import { WorkflowPhase } from '../phases/types';

// Constants
const MAX_ACCUMULATED_CHUNK_SIZE = 10000; // 10KB limit for accumulated chunks

/**
 * Error messages
 */
export const JSON_PARSE_ERROR = 'Failed to parse JSON content';
export const MAX_RETRY_ERROR = 'Max retry attempts reached for JSON parsing';

export async function* retryableAsyncGenerator<T>(
  phase: WorkflowPhase,
  generatorFactory: () => AsyncGenerator<string, T, unknown>,
): AsyncGenerator<string, T, unknown> {
  let result: IteratorResult<string, T> | null = null;
  let lastError: unknown = null;
  let message: StreamingAssistantMessage | null = null;
  let accumulatedChunks = '';

  const queue: (() => void)[] = [];

  const waitForRetry = () =>
    new Promise<void>(resolve => {
      queue.push(resolve);
    });

  const retryHandler = (retryPhase: WorkflowPhase) => {
    if (retryPhase === phase) {
      const next = queue.shift();
      if (next) next(); // proceed to retry
    }
  };

  const retryCallback = useRetryEventBusStore.getState().registerRetryCallback(retryHandler);

  try {
    do {
      const generator = generatorFactory();
      result = null;
      lastError = null;
      message = null;
      accumulatedChunks = '';

      try {
        for await (const chunk of generator) {
          // Skip empty chunks - ensure chunk is a string before calling trim()
          if (!chunk || typeof chunk !== 'string' || !chunk.trim()) {
            yield chunk;
            continue;
          }

          // Accumulate chunks to help with parsing, but limit total size
          accumulatedChunks += chunk;
          if (accumulatedChunks.length > MAX_ACCUMULATED_CHUNK_SIZE) {
            // Trim to keep only the most recent data if we exceed the limit
            accumulatedChunks = accumulatedChunks.slice(-MAX_ACCUMULATED_CHUNK_SIZE);
          }

          // Create or update the message
          try {
            message = message
              ? message.addToken(chunk)
              : StreamingAssistantMessage.fromContent(accumulatedChunks);

            // Try parsing the content, this will throw if there's an error
            message.tryParseContent(phase);
          } catch (parseError) {
            // During streaming, we expect some JSON parse errors as content is incomplete
            if (
              parseError instanceof Error &&
              parseError.message.includes(JSON_PARSE_ERROR) &&
              // Only for non-alignment phases and when we're still accumulating content
              // Also be more lenient with step phases, since they may be partial JSON
              phase !== 'alignment' &&
              (accumulatedChunks.length < 500 || phase === 'step')
            ) {
              // This is an expected error during streaming, just log and continue
              console.warn(`Non-critical parse error in phase [${phase}], continuing...`);
            } else {
              // Propagate other errors to the outer catch block
              throw parseError;
            }
          }

          yield chunk;
        }
        result = await generator.next(); // Final return

        // If we have a message and the final result doesn't, use our message
        if (message && (!result.value || result.value === '')) {
          result = { done: true, value: message as unknown as T };
        }
      } catch (error) {
        // If it's a non-critical error during streaming, log and continue
        if (
          error instanceof Error &&
          (error.message.includes(JSON_PARSE_ERROR) || error.message.includes(MAX_RETRY_ERROR)) &&
          (phase === 'step' || phase !== 'alignment')
        ) {
          console.warn(`Recoverable error in phase [${phase}]:`, error.message);
          // Don't set lastError so we exit the retry loop

          // Instead of returning an empty string, return the last message if available
          if (message) {
            result = { done: true, value: message as unknown as T };
          } else {
            // Fallback to whatever the generator would have returned
            result = { done: true, value: '' as T };
          }
        } else {
          // For critical errors, use the retry mechanism
          lastError = error;
          console.error(`Phase [${phase}] failed:`, error);
          await waitForRetry(); // Wait for retry signal
        }
      }
    } while (lastError != null);
  } finally {
    useRetryEventBusStore.getState().unregisterRetryCallback(retryCallback);
  }

  if (!result) {
    throw new Error('Generator completed without a result');
  }

  return result.value as T;
}
