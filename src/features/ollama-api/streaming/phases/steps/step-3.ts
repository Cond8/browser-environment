// src/features/ollama-api/streaming/phases/steps/step-3.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';

export const THIRD_STEP_PROMPT = () =>
  `
## TASK

Generate the third enrichment step based on the previous steps provided. The format should match the structure of the previous steps.
Output only the JSON for the step.

### Response:
`.trim();

export const THIRD_STEP_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(2),
  },
  {
    role: 'user',
    content: THIRD_STEP_PROMPT(),
  },
];
