// src/features/ollama-api/streaming/phases/steps/step-2-to-6-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';
import { FIRST_STEP_MESSAGES } from './step-1-phase';
import { SECOND_STEP_MESSAGES } from './step-2';
import { THIRD_STEP_MESSAGES } from './step-3';
import { FOURTH_STEP_MESSAGES } from './step-4';
import { FIFTH_STEP_MESSAGES } from './step-5';
import { SIXTH_STEP_MESSAGES } from './step-6';
export async function* secondToSixthStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
  stepNumber: number,
): AsyncGenerator<string, string, unknown> {
  let messages = [
    ...FIRST_STEP_MESSAGES(userReq, assistantMessage),
    ...SECOND_STEP_MESSAGES(assistantMessage),
  ];
  if (stepNumber > 2) {
    messages.push(...THIRD_STEP_MESSAGES(assistantMessage));
  }
  if (stepNumber > 3) {
    messages.push(...FOURTH_STEP_MESSAGES(assistantMessage));
  }
  if (stepNumber > 4) {
    messages.push(...FIFTH_STEP_MESSAGES(assistantMessage));
  }
  if (stepNumber > 5) {
    messages.push(...SIXTH_STEP_MESSAGES(assistantMessage));
  }
  console.log('[secondToSixthStepPhase] messages', stepNumber, messages);
  return yield* chatFn({ messages });
}
