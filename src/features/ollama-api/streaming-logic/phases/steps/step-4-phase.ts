// src/features/ollama-api/streaming-logic/phases/steps/step-4-phase.ts
import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import { usePromptStore } from '@/features/ollama-api/stores/prompt-store';
import { Message } from 'ollama';

export const STEP_4_PHASE_MESSAGES = (
  userReq: string,
  assistantResponse: AssistantResponse,
): Message[] => [
  {
    role: 'assistant',
    content: usePromptStore
      .getState()
      .makePrompt('assistant_decide', { userReq, assistantResponse, step: 'Decide' }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_format', { userReq, assistantResponse, step: 'Format' }),
  },
];
