// src/features/ollama-api/streaming-logic/phases/steps/step-3-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';

import { UserRequest } from '../types';
import { STEP_1_PHASE_MESSAGES } from './step-1-phase';
import { STEP_2_PHASE_MESSAGES } from './step-2-phase';

import { usePromptStore } from '../../stores/prompt-store';

export function getStep3Prompt() {
  return usePromptStore.getState().step3Prompt;
}


export const STEP_3_PHASE_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(2),
  },
  { role: 'user', content: getStep3Prompt() },
];


export async function* thirdStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      ...STEP_1_PHASE_MESSAGES(userReq, assistantMessage),
      ...STEP_2_PHASE_MESSAGES(assistantMessage),
      ...STEP_3_PHASE_MESSAGES(assistantMessage),
    ],
  });
}
