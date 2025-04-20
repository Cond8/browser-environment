// src/features/ollama-api/streaming-logic/phases/alignment-phase.ts
import { Message } from 'ollama';

import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import { usePromptStore } from '../../stores/prompt-store';

export const ALIGNMENT_MESSAGES = (
  userReq: string,
  assistantResponse: AssistantResponse,
): Message[] => [
  {
    role: 'system',
    content: usePromptStore
      .getState()
      .makePrompt('alignment', { userReq, assistantResponse, step: 'Alignment' }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_alignment', { userReq, assistantResponse, step: 'Alignment' }),
  },
];
