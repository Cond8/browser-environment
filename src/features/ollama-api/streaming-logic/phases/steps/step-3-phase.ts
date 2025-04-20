// src/features/ollama-api/streaming-logic/phases/steps/step-3-phase.ts
import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import { usePromptStore } from '@/features/ollama-api/stores/prompt-store';
import { Message } from 'ollama';

export const STEP_3_PHASE_MESSAGES = (
  userReq: string,
  assistantResponse: AssistantResponse,
): Message[] => [
  {
    role: 'assistant',
    content: usePromptStore
      .getState()
      .makePrompt('assistant_analyze', { userReq, assistantResponse, step: 'Analyze' }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_decide', { userReq, assistantResponse, step: 'Decide' }),
  },
];
