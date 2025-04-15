// src/features/ollama-api/streaming/phases/interface-phase.ts
import { ChatRequest } from 'ollama';
import { SYSTEM_PROMPT } from '../../prompts/prompts-system';
import { WorkflowChainError } from '../api/workflow-chain';

export const INTERFACE_PROMPT = (userRequest: string) =>
  `
User request: ${userRequest}

Output only the JSON block and nothing else.

`.trim();

export async function* interfacePhase(
  userRequest: string,
  alignmentResponse: string,
  chatFn: (
    request: Omit<ChatRequest, 'model' | 'stream'>,
  ) => AsyncGenerator<string, string, unknown>,
): AsyncGenerator<string, string, unknown> {
  try {
    const prompt = SYSTEM_PROMPT(INTERFACE_PROMPT(userRequest));
    console.log('[interfacePhase] Prompt:', prompt);
    return yield* chatFn({
      messages: [
        {
          role: 'system',
          content: prompt,
        },
      ],
      options: {
        stop: ['*/'],
      },
    });
  } catch (err) {
    throw new WorkflowChainError(
      'Interface generation failed',
      'interface',
      err instanceof Error ? err : undefined,
      { userRequest, alignmentResponse },
    );
  }
}
