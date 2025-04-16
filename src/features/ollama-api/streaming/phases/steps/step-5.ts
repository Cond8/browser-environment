// src/features/ollama-api/streaming/phases/steps/step-5.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';

export const FIFTH_STEP_PROMPT = () =>
  `
## TASK

Generate the fifth decision step based on the previous steps provided. The format should match the structure of the previous steps.
Output only the JSON for the step.

### Response:
`.trim();

export const FIFTH_STEP_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(4),
  },
  {
    role: 'user',
    content: FIFTH_STEP_PROMPT(),
  },
];
