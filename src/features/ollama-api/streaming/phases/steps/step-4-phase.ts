// src/features/ollama-api/streaming/phases/steps/step-4-phase.ts
import { WorkflowMultiStep } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';
import { FIRST_STEP_MESSAGES } from './step-1-phase';
import { SECOND_STEP_MESSAGES } from './step-2-phase';
import { THIRD_STEP_MESSAGES } from './step-3-phase';

export const FOURTH_STEP_PROMPT = () =>
  `
## TASK

Generate the fourth analysis step based on the previous steps provided. The format should match the structure of the previous steps.
Output only the JSON for the step.

### Response:
`.trim();

export const FOURTH_STEP_MESSAGES = (steps: WorkflowMultiStep) => [
  {
    role: 'assistant',
    content: steps[3].toStepString,
  },
  {
    role: 'user',
    content: FOURTH_STEP_PROMPT(),
  },
];

export async function* fourthStepPhase(
  userReq: UserRequest,
  steps: WorkflowMultiStep,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      ...FIRST_STEP_MESSAGES(userReq, steps),
      ...SECOND_STEP_MESSAGES(steps),
      ...THIRD_STEP_MESSAGES(steps),
      ...FOURTH_STEP_MESSAGES(steps),
    ],
  });
}
