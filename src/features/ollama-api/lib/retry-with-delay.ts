import { WorkflowChainError } from "../workflow-chain";


const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function retryWithDelay<T>(
  fn: () => Promise<T>,
  phase: 'interface' | 'steps' | 'stream' | 'alignment',
  context?: Record<string, unknown>,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
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

  throw new WorkflowChainError(`Failed after ${MAX_RETRIES} attempts`, phase, lastError, context);
}