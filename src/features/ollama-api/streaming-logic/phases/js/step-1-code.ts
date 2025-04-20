// src/features/ollama-api/streaming-logic/phases/js/step-1-code.ts
import { Message } from 'ollama';

import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import {usePromptStore} from '../../../stores/prompt-store';

export const STEP_1_CODE_MESSAGES = (
  userReq: string,
  assistantResponse: AssistantResponse,
): Message[] => [
  {
    role: 'system',
    content: usePromptStore
      .getState()
      .makePrompt('codegen_enrich', { userReq, assistantResponse, step: 'Codegen Enrich' }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_enrich', { userReq, assistantResponse, step: 'Codegen Enrich' }),
  },
];
