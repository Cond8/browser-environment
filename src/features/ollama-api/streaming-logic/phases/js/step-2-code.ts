// src/features/ollama-api/streaming-logic/phases/js/step-2-code.ts
import { Message } from 'ollama';

import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import { usePromptStore } from '../../../stores/prompt-store';
import { STEP_1_CODE_MESSAGES } from '../js/step-1-code';

export const STEP_2_CODE_MESSAGES = (
  userReq: string,
  assistantResponse: AssistantResponse,
): Message[] => [
  ...STEP_1_CODE_MESSAGES(userReq, assistantResponse),
  {
    role: 'assistant',
    content: usePromptStore
      .getState()
      .makePrompt('assistant_codegen_enrich', {
        userReq,
        assistantResponse,
        step: 'Codegen Enrich',
      }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_analyze', { userReq, assistantResponse, step: 'Codegen Analyze' }),
  },
];
