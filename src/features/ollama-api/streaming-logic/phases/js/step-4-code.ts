// src/features/ollama-api/streaming-logic/phases/js/step-4-code.ts
import { Message } from 'ollama';

import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import { usePromptStore } from '../../../stores/prompt-store';
import { STEP_3_CODE_MESSAGES } from '../js/step-3-code';

export const STEP_4_CODE_MESSAGES = (
  userReq: string,
  assistantResponse: AssistantResponse,
): Message[] => [
  ...STEP_3_CODE_MESSAGES(userReq, assistantResponse),
  {
    role: 'system',
    content: usePromptStore.getState().makePrompt('assistant_codegen_decide', {
      userReq,
      assistantResponse,
      step: 'Codegen Decide',
    }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_format', { userReq, assistantResponse, step: 'Codegen Format' }),
  },
];
