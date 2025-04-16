// src/features/ollama-api/streaming/infra/retry-with-delay.ts
import { WorkflowChainError } from '../api/workflow-chain';
import { WorkflowPhase } from '../phases/types';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function* retryWithDelay<TReturn>(
  asyncGeneratorFn: () => AsyncGenerator<string, any, unknown>,
  parserFn: (response: string) => TReturn,
  validatorFn: (response: TReturn) => void,
  phase: WorkflowPhase,
  ...metadata: unknown[]
): AsyncGenerator<string, TReturn, unknown> {
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
      yield* '[BREAK]';
      continue;
    }

    /** ============================================================
     * STEP 2: PARSER
     * ============================================================ */
    if (response) {
      let parsed: TReturn;
      try {
        parsed = parserFn(response);
      } catch (error: any) {
        console.log('response', response);
        lastError = error as Error;
        console.warn(`[WorkflowChain] ${phase} phase PARSER failed:`, error.message);
        if (attempt < MAX_RETRIES) {
          console.log(`[WorkflowChain] Retrying ${phase} phase PARSER in ${RETRY_DELAY_MS}ms...`);
          await new Promise((resolve: (value: unknown) => void) =>
            setTimeout(resolve, RETRY_DELAY_MS),
          );
        }
        yield* '[BREAK]';
        continue;
      }

      /** ============================================================
       * STEP 3: VALIDATOR
       * ============================================================ */
      try {
        validatorFn(parsed);
        return parsed;
      } catch (error: any) {
        lastError = error as Error;
        console.warn(`[WorkflowChain] ${phase} phase VALIDATOR failed:`, error.message);
        if (attempt < MAX_RETRIES) {
          console.log(
            `[WorkflowChain] Retrying ${phase} phase VALIDATOR in ${RETRY_DELAY_MS}ms...`,
          );
          await new Promise((resolve: (value: unknown) => void) =>
            setTimeout(resolve, RETRY_DELAY_MS),
          );
        }
        yield* '[BREAK]';
        continue;
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
