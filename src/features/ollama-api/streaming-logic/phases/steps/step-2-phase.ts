// src/features/ollama-api/streaming-logic/phases/steps/step-2-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';

import { UserRequest } from '../types';
import { STEP_1_PHASE_MESSAGES } from './step-1-phase';

import { usePromptStore } from '../../stores/prompt-store';

export function getStep2Prompt() {
  return usePromptStore.getState().step2Prompt;
}


export const STEP_2_PHASE_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(1),
  },
  { role: 'user', content: getStep2Prompt() },
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
