// src/features/ollama-api/streaming-logic/phases/steps/step-1-phase.ts
import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import { usePromptStore } from '@/features/ollama-api/stores/prompt-store';
import { Message } from 'ollama';

export const STEP_1_PHASE_MESSAGES = (
  userReq: string,
  assistantResponse: AssistantResponse,
): Message[] => [
  {
    role: 'system',
    content: usePromptStore
      .getState()
      .makePrompt('steps', { userReq, assistantResponse, step: 'Enrich' }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_enrich', { userReq, assistantResponse, step: 'Enrich' }),
  },
];
