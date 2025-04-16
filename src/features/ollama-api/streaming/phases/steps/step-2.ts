// src/features/ollama-api/streaming/phases/steps/step-2.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';

export const SECOND_STEP_PROMPT = () =>
  `
## TASK

Generate the second extraction step based on the previous step provided. The format should match the structure of the previous step.
Output only the JSON for the step.

### Response:
`.trim();

export const SECOND_STEP_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(1),
  },
  {
    role: 'user',
    content: SECOND_STEP_PROMPT(),
  },
];
