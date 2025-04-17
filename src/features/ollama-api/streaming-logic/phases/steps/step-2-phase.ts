// src/features/ollama-api/streaming/phases/steps/step-2-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';
import { STEP_1_MESSAGES } from './step-1-phase';

export const STEP_2_PROMPT = () =>
  `
Generate the second step: logic.

Use the same format as the enrich step. This step should analyze the enriched data and make decisions.

Output a single valid JSON object only.
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
    messages: [
      ...STEP_1_MESSAGES(userReq, assistantMessage),
      ...STEP_2_MESSAGES(assistantMessage),
    ],
  });
}
