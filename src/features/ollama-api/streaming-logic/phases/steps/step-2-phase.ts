// src/features/ollama-api/streaming-logic/phases/steps/step-2-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { JSON_RULES } from '../rules';
import { UserRequest } from '../types';
import { STEP_1_MESSAGES } from './step-1-phase';

export const STEP_2_PROMPT = () =>
  `
Generate the second step: **Logic**.

This step:
- Uses enriched input from step 1
- Performs reasoning: filtering, comparison, classification
- Returns a decision, judgment, or narrowed result

Modules (pick one):
  logic: [filter, compare, match, decide, choose, group, map]
  slm  : [infer, classify, analyze]

${JSON_RULES}
`.trim();

export const STEP_2_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content:
      typeof assistantMessage.getStepString(1) === 'string'
        ? assistantMessage.getStepString(1)
        : JSON.stringify(assistantMessage.getStepString(1)),
  },
  { role: 'user', content: STEP_2_PROMPT() },
];

export async function* secondStepPhase(
  userReq: UserRequest,
): AsyncGenerator<string, string, unknown> {
  const assistantMessage = new AssistantMessage();
  assistantMessage.rawChunks = [userReq.alignmentResponse];
  return yield* chatFn({
    messages: [...STEP_1_MESSAGES(userReq, assistantMessage), ...STEP_2_MESSAGES(assistantMessage)],
  });
}
