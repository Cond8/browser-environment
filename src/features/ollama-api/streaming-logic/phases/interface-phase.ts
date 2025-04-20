// src/features/ollama-api/streaming-logic/phases/interface-phase.ts
import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import { usePromptStore } from '@/features/ollama-api/stores/prompt-store';

export const INTERFACE_MESSAGES = (userReq: string, assistantResponse: AssistantResponse) => [
  {
    role: 'system',
    content: usePromptStore
      .getState()
      .makePrompt('interface', { userReq, assistantResponse, step: 'Interface' }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_interface', { userReq, assistantResponse, step: 'Interface' }),
  },
];
