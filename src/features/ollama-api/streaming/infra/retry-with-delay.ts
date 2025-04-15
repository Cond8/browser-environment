// src/features/ollama-api/streaming/infra/retry-with-delay.ts
import { WorkflowChainError } from '../api/workflow-chain';
import { WorkflowPhase } from '../phases/types';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function* retryWithDelay<T, TReturn>(
  asyncGeneratorFn: () => AsyncGenerator<T, string, unknown>,
  parserFn: (response: string) => TReturn,
  phase: WorkflowPhase,
  ...metadata: unknown[]
): AsyncGenerator<T, TReturn, unknown> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let response: string;

    try {
      response = yield* asyncGeneratorFn();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[WorkflowChain] ${phase} phase connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        error,
      );

      if (attempt < MAX_RETRIES) {
        console.log(`[WorkflowChain] Retrying ${phase} phase connection in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
      continue;
    }

    if (response) {
      try {
        return parserFn(response);
      } catch (error) {
        lastError = error as Error;
        console.warn(`[WorkflowChain] ${phase} phase parser failed:`, error);
        if (attempt < MAX_RETRIES) {
          console.log(`[WorkflowChain] Retrying ${phase} phase parser in ${RETRY_DELAY_MS}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
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
