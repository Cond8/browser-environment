// src/features/ollama-api/streaming/phases/steps/step-3-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';
import { STEP_1_MESSAGES } from './step-1-phase';
import { STEP_2_MESSAGES } from './step-2-phase';

export const STEP_3_PROMPT = () =>
  `
Generate the third step: **Format**.

This step should:
- Take the processed data from the Logic step
- Structure it into a clear, human-readable format
- Ensure all necessary information is present and properly organized
- Prepare the final output for delivery or display

The focus is purely on presentation - no new data gathering or logical operations should be introduced.

Use the same JSON structure as previous steps, but focus on formatting and presentation aspects.

Respond with a single valid JSON object wrapped in markdown code fences.
`.trim();

export const STEP_3_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(2),
  },
  {
    role: 'user',
    content: STEP_3_PROMPT(),
  },
];

export async function* thirdStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      ...STEP_1_MESSAGES(userReq, assistantMessage),
      ...STEP_2_MESSAGES(assistantMessage),
      ...STEP_3_MESSAGES(assistantMessage),
    ],
  });
}
