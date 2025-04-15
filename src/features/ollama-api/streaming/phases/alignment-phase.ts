// src/features/ollama-api/streaming/phases/alignment-phase.ts
import { ChatRequest } from 'ollama';
import { WorkflowChainError } from '../api/workflow-chain';

export const ALIGNMENT_PROMPT = () =>
  `
You are an analyst who breaks down workflow requirements before implementation.

Analyze the request in these three aspects:

1. Goal
   - Core objective
   - Key constraints

2. Components
   - Required inputs/outputs
   - Critical processing steps

3. Technical Direction
   - Suggested workflow approach
   - Key implementation considerations

Be concise. Planning mode.

## Task: Analyze Request
`.trim();

export async function* alignmentPhase(
  userRequest: string,
  chatFn: (
    request: Omit<ChatRequest, 'model' | 'stream'>,
  ) => AsyncGenerator<string, string, unknown>,
): AsyncGenerator<string, string, unknown> {
  try {
    return yield* chatFn({
      messages: [
        {
          role: 'system',
          content: ALIGNMENT_PROMPT(),
        },
        {
          role: 'user',
          content: userRequest,
        },
      ],
    });
  } catch (err) {
    throw new WorkflowChainError(
      'Alignment phase failed',
      'alignment',
      err instanceof Error ? err : undefined,
      userRequest,
    );
  }
}
