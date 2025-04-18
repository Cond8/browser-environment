// src/features/ollama-api/streaming-logic/phases/steps/step-4-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { JSON_RULES } from '../rules';
import { UserRequest } from '../types';
import { STEP_1_MESSAGES } from './step-1-phase';
import { STEP_2_MESSAGES } from './step-2-phase';
import { STEP_3_MESSAGES } from './step-3-phase';

export const STEP_4_PROMPT = () =>
  `
Generate the fourth step: **Format**.

This step:
- Uses output from the Decide step
- Structures it for delivery: clean, readable, well‑organized
- No new logic or data

Modules (pick one):
  format: [stringify, summarize, render, compile, prepare]

${JSON_RULES}

Output a single, complete JSON object. Surrounded by \`\`\`json and \`\`\`.
`.trim();

export const STEP_4_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(3),
  },
  { role: 'user', content: STEP_4_PROMPT() },
];

export async function* fourthStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      ...STEP_1_MESSAGES(userReq, assistantMessage),
      ...STEP_2_MESSAGES(assistantMessage),
      ...STEP_3_MESSAGES(assistantMessage),
      ...STEP_4_MESSAGES(assistantMessage),
    ],
  });
}
