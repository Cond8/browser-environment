// src/features/ollama-api/streaming/infra/retry-with-delay.ts
import { WorkflowChainError } from '../api/workflow-chain';
import { WorkflowPhase } from '../phases/types';

const MAX_RETRIES = 1;
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

    try {
      const generator = asyncGeneratorFn();
      for await (const chunk of generator) {
        response += chunk;
        yield chunk;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[WorkflowChain] ${phase} phase connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        error,
      );

      if (attempt < MAX_RETRIES) {
        console.log(`[WorkflowChain] Retrying ${phase} phase connection in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve: (value: unknown) => void) =>
          setTimeout(resolve, RETRY_DELAY_MS),
        );
      }
      yield* '[BREAK]';
      continue;
    }

    if (response) {
      let parsed: TReturn;
      try {
        parsed = parserFn(response);
      } catch (error) {
        console.log('response', response);
        lastError = error as Error;
        console.warn(`[WorkflowChain] ${phase} phase parser failed:`, error);
        if (attempt < MAX_RETRIES) {
          console.log(`[WorkflowChain] Retrying ${phase} phase parser in ${RETRY_DELAY_MS}ms...`);
          await new Promise((resolve: (value: unknown) => void) =>
            setTimeout(resolve, RETRY_DELAY_MS),
          );
        }
        yield* '[BREAK]';
        continue;
      }

      try {
        validatorFn(parsed);
        return parsed;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[WorkflowChain] ${phase} phase validator failed:`, error);
        if (attempt < MAX_RETRIES) {
          console.log(
            `[WorkflowChain] Retrying ${phase} phase validator in ${RETRY_DELAY_MS}ms...`,
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
