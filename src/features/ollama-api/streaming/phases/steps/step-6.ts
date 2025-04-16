// src/features/ollama-api/streaming/phases/steps/step-6.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';

export const SIXTH_STEP_PROMPT = () =>
  `
## TASK

Generate the sixth and final formatting step based on the previous steps provided. The format should match the structure of the previous steps.
Output only the JSON for the step.

### Response:
`.trim();

export const SIXTH_STEP_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(5),
  },
  {
    role: 'user',
    content: SIXTH_STEP_PROMPT(),
  },
];
