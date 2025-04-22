// src/features/ollama-api/streaming-logic/phases/js/step-3-code.ts
import { Message } from 'ollama';

import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import { usePromptStore } from '../../../stores/prompt-store';
import { STEP_2_CODE_MESSAGES } from '../js/step-2-code';

export const STEP_3_CODE_MESSAGES = (
  userReq: string,
  assistantResponse: AssistantResponse,
): Message[] => [
  ...STEP_2_CODE_MESSAGES(userReq, assistantResponse),
  {
    role: 'system',
    content: usePromptStore
      .getState()
      .makePrompt('assistant_codegen_analyze', {
        userReq,
        assistantResponse,
        step: 'Codegen Analyze',
      }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_decide', { userReq, assistantResponse, step: 'Codegen Decide' }),
  },
];
