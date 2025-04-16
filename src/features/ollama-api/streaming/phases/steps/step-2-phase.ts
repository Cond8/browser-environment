import { SYSTEM_PROMPT } from '@/features/ollama-api/streaming/phases/prompts-system';
import { ChatRequest } from 'ollama';
import { WorkflowStep } from '../../api/workflow-step';

import { FIRST_STEP_PROMPT } from './step-1-phase';
import { chatFn } from '../../infra/create-chat';
export const SECOND_STEP_PROMPT = () =>
  `
## TASK

Generate the second extraction step based on the previous step provided. The format should match the structure of the previous step.
Output only the JSON for the step.

### Response:
`.trim();

export async function* secondStepPhase(
  userRequest: string,
  alignmentResponse: string,
  interfaceResponse: WorkflowStep,
  firstStep: WorkflowStep,
): AsyncGenerator<string, string, unknown> {
  console.log('[secondStepPhase] Starting step generation with prompt:', prompt);
  return yield* chatFn({
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT(FIRST_STEP_PROMPT(userRequest, interfaceResponse)),
      },
      {
        role: 'user',
        content: alignmentResponse,
      },
      {
        role: 'assistant',
        content: '```json \n' + JSON.stringify(firstStep, null, 2) + '\n```',
      },
      {
        role: 'user',
        content: SECOND_STEP_PROMPT(),
      },
    ],
  });
}
