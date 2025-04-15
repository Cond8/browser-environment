// src/features/ollama-api/streaming/phases/interface-phase.ts
import { ChatRequest } from 'ollama';
import { WorkflowChainError } from '../api/workflow-chain';
import { SYSTEM_PROMPT } from './prompts-system';

export const INTERFACE_PROMPT = (userRequest: string) =>
  `
You are an assistant that generates structured **JSON-based interfaces** for workflows.

Each response must be a **single, valid JSON object** and nothing else. Do not include any extra text, markdown, backticks, or explanations.

Respond only with the raw JSON, like:
{
  "interface": {
    ...
  }
}

User request: ${userRequest}

Output a single JSON object only.
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
