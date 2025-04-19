// src/features/ollama-api/streaming-logic/phases/steps/step-1-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';

import { UserRequest } from '../types';

import { usePromptStore } from '../../stores/prompt-store';

// Helper to build the prompt string with interpolation
export function getStep1Prompt(userRequest: string, interfaceResponse: string) {
  const promptTemplate = usePromptStore.getState().step1Prompt;
  return promptTemplate
    .replace(/\{\{userRequest\}\}/g, userRequest)
    .replace(/\{\{interfaceResponse\}\}/g, interfaceResponse);
}


export const STEP_1_PHASE_MESSAGES = (userReq: UserRequest, assistantMessage: AssistantMessage) => [
  {
    role: 'system',
    content: getStep1Prompt(userReq.userRequest, assistantMessage.interfaceString),
  },
  {
    role: 'user',
    content: assistantMessage.alignmentResponse,
  },
];

