// src/features/ollama-api/streaming-logic/infra/retry-with-delay.ts
import { WorkflowChainError } from '../api/workflow-chain';
import { WorkflowPhase } from '../phases/types';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function* retryWithDelay(
  asyncGeneratorFn: () => AsyncGenerator<string, string, unknown>,
  phase: WorkflowPhase,
  ...metadata: unknown[]
): AsyncGenerator<string, string, unknown> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let response = '';

    /** ============================================================
     * STEP 1: CONNECTION
     * ============================================================ */
    try {
      const generator = asyncGeneratorFn();
      for await (const chunk of generator) {
        response += chunk;
        yield chunk;
      }
    } catch (error: any) {
      lastError = error as Error;
      yield* `[ERROR] ${error.message}`;
      console.warn(
        `[WorkflowChain] ${phase} phase CONNECTION attempt ${attempt}/${MAX_RETRIES} failed:`,
        error.message,
      );

      if (attempt < MAX_RETRIES) {
        console.log(`[WorkflowChain] Retrying ${phase} phase CONNECTION in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve: (value: unknown) => void) =>
          setTimeout(resolve, RETRY_DELAY_MS),
        );
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
