// src/features/ollama-api/streaming/phases/steps/step-2-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';
import { STEP_1_MESSAGES } from './step-1-phase';

export const STEP_2_PROMPT = () =>
  `
Generate the second step: **Logic**.

This step should:
- Take the enriched data from the previous step as input
- Perform analysis, comparison, or filtering operations
- Make a clear decision or derive a specific insight
- Return a focused, processed result that's ready for formatting

The output should be more focused than the input, unless the logic itself requires producing structured data.

Use the same JSON structure as the Enrich step, but focus on logical operations rather than data gathering.

Respond with a single valid JSON object wrapped in markdown code fences.
`.trim();

export const STEP_2_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(1),
  },
  {
    role: 'user',
    content: STEP_2_PROMPT(),
  },
];

export async function* secondStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [...STEP_1_MESSAGES(userReq, assistantMessage), ...STEP_2_MESSAGES(assistantMessage)],
  });
}
