// src/features/ollama-api/streaming/phases/steps/step-4.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';

export const FOURTH_STEP_PROMPT = () =>
  `
## TASK

Generate the fourth analysis step based on the previous steps provided. The format should match the structure of the previous steps.
Output only the JSON for the step.

### Response:
`.trim();

export const FOURTH_STEP_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(3),
  },
  {
    role: 'user',
    content: FOURTH_STEP_PROMPT(),
  },
];
