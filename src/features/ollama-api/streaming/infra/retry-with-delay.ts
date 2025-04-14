// src/features/ollama-api/streaming/infra/retry-with-delay.ts
import { WorkflowChainError } from '../api/workflow-chain';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function* retryWithDelay<T, TReturn>(
  fn: () => AsyncGenerator<T, TReturn, unknown>,
  phase: 'interface' | 'step' | 'stream' | 'alignment',
  ...metadata: unknown[]
): AsyncGenerator<T, TReturn, unknown> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return yield* fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[WorkflowChain] ${phase} phase attempt ${attempt}/${MAX_RETRIES} failed:`,
        error,
      );

      if (attempt < MAX_RETRIES) {
        console.log(`[WorkflowChain] Retrying ${phase} phase in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw new WorkflowChainError(
    `Failed after ${MAX_RETRIES} attempts`,
    phase,
    lastError,
    ...metadata,
  );
}
