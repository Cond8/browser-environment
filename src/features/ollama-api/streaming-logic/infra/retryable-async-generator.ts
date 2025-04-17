// src/features/ollama-api/streaming-logic/infra/retryable-async-generator.ts
import { StreamingAssistantMessage } from '@/features/chat/models/assistant-message';
import { useRetryEventBusStore } from '../../stores/retry-event-bus-store';
import { WorkflowPhase } from '../phases/types';

export async function* retryableAsyncGenerator<T>(
  phase: WorkflowPhase,
  generatorFactory: () => AsyncGenerator<string, T, unknown>,
): AsyncGenerator<string, T, unknown> {
  let result: IteratorResult<string, T> | null = null;
  let lastError: unknown = null;
  let message: StreamingAssistantMessage | null = null;

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

  const unregister = useRetryEventBusStore.getState().registerRetryCallback(retryHandler);

  try {
    do {
      const generator = generatorFactory();
      result = null;
      lastError = null;
      message = null;

      try {
        for await (const chunk of generator) {
          // Create or update the message with the new chunk
          message = message
            ? message.addToken(chunk)
            : StreamingAssistantMessage.fromContent(chunk);

          // Try parsing the content, this will throw if there's an error
          message.tryParseContent(phase);

          yield chunk;
        }
        result = await generator.next(); // Final return
      } catch (error) {
        lastError = error;
        console.error(`Phase [${phase}] failed:`, error);
        await waitForRetry(); // Wait for retry signal
      }
    } while (lastError != null);
  } finally {
    useRetryEventBusStore.getState().unregisterRetryCallback(unregister);
  }

  if (!result) {
    throw new Error('Generator completed without a result');
  }

  return result.value as T;
}
