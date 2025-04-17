// src/features/ollama-api/streaming-logic/phases/steps/step-3-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { JSON_RULES } from '../rules';
import { UserRequest } from '../types';
import { STEP_1_MESSAGES } from './step-1-phase';
import { STEP_2_MESSAGES } from './step-2-phase';

export const STEP_3_PROMPT = () =>
  `
Generate the third step: **Format**.

This step:
- Uses output from the Logic step
- Structures it for delivery: clean, readable, well‑organized
- No new logic or data

Modules (pick one):
  format: [format, stringify, summarize, render, compile, prepare]

${JSON_RULES}
`.trim();

export const STEP_3_MESSAGES = (assistantMessage: AssistantMessage) => [
  { role: 'assistant', content: assistantMessage.getStepString(2) },
  { role: 'user', content: STEP_3_PROMPT() },
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
