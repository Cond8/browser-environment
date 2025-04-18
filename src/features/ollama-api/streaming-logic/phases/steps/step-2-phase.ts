// src/features/ollama-api/streaming-logic/phases/steps/step-2-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { JSON_RULES } from '../rules';
import { UserRequest } from '../types';
import { STEP_1_PHASE_MESSAGES } from './step-1-phase';

export const STEP_2_PHASE_PROMPT = () =>
  `
Generate the second step: **Analyze**.

This step:
- Uses enriched input from step 1
- Performs pure, side-effect-free calculations, data transformations, or insight extraction
- No branching, filtering, or control flow—just analysis

Modules (pick one):
  analyze: [compute, extract, summarize, transform, calculate, measure, score]
  slm  : [analyze, interpret, derive]

${JSON_RULES}
`.trim();

export const STEP_2_PHASE_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(1),
  },
  { role: 'user', content: STEP_2_PHASE_PROMPT() },
];

export async function* secondStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      ...STEP_1_PHASE_MESSAGES(userReq, assistantMessage),
      ...STEP_2_PHASE_MESSAGES(assistantMessage),
    ],
  });
}
