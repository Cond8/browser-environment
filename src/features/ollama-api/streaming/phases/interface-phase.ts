// src/features/ollama-api/streaming/phases/interface-phase.ts
import { dslToJson } from '@/features/editor/transpilers-dsl-source/dsl-to-json';
import { ChatRequest } from 'ollama';
import { SYSTEM_PROMPT } from '../../prompts/prompts-system';
import { WorkflowChainError } from '../api/workflow-chain';
import { WorkflowStep } from '../api/workflow-step';

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
): AsyncGenerator<string, WorkflowStep, unknown> {
  let response;
  try {
    const prompt = SYSTEM_PROMPT(INTERFACE_PROMPT(userRequest));
    console.log('[interfacePhase] Prompt:', prompt);
    response = yield* chatFn({
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

    return dslToJson(response);
  } catch (err) {
    throw new WorkflowChainError(
      'Interface generation failed',
      'interface',
      err instanceof Error ? err : undefined,
      { userRequest, alignmentResponse },
    );
  }
}
