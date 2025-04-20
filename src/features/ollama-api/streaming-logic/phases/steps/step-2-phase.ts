// src/features/ollama-api/streaming-logic/phases/steps/step-2-phase.ts
import { AssistantResponse } from '@/features/ollama-api/prompts/assistant-response';
import { usePromptStore } from '@/features/ollama-api/stores/prompt-store';

export const STEP_2_PHASE_MESSAGES = (userReq: string, assistantResponse: AssistantResponse) => [
  {
    role: 'assistant',
    content: usePromptStore
      .getState()
      .makePrompt('assistant_enrich', { userReq, assistantResponse, step: 'Enrich' }),
  },
  {
    role: 'user',
    content: usePromptStore
      .getState()
      .makePrompt('user_analyze', { userReq, assistantResponse, step: 'Analyze' }),
  },
];
