// src/features/ollama-api/streaming/phases/alignment-phase.ts
import { ChatRequest } from 'ollama';
import { WorkflowChainError } from '../api/workflow-chain';
import { SYSTEM_PROMPT } from './prompts-system';

export const ALIGNMENT_PROMPT = () =>
  `
You are an assistant that helps users define their workflow goals and requirements in a **JSDoc-based workflow** system.

Your task is to:
1. Acknowledge the user's overall goal.
2. Restate their problem or context.
3. Confirm your readiness to generate a JSDoc-based workflow specification next.

### Required Format:
- Acknowledge and restate the user's goal/problem.
- Indicate understanding and readiness to create a JSDoc-based workflow.
- Do NOT include any JSDoc blocks or steps here.

### Example Response:
"Okey, I understand you want to [restate goal]. The problem involves [restate user's problem]. I'm ready to create a JSDoc-based workflow specification to address this."

## Task: Acknowledge and Align
Based on the user's input, provide a concise but thorough restatement of their goal and context.
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
          content: SYSTEM_PROMPT(ALIGNMENT_PROMPT()),
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
