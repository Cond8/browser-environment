// src/features/ollama-api/streaming/phases/steps/step-6-phase.ts
import { WorkflowMultiStep } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';
import { FIRST_STEP_MESSAGES } from './step-1-phase';
import { SECOND_STEP_MESSAGES } from './step-2-phase';
import { THIRD_STEP_MESSAGES } from './step-3-phase';
import { FOURTH_STEP_MESSAGES } from './step-4-phase';
import { FIFTH_STEP_MESSAGES } from './step-5-phase';

export const SIXTH_STEP_PROMPT = () =>
  `
## TASK

Generate the sixth and final formatting step based on the previous steps provided. The format should match the structure of the previous steps.
Output only the JSON for the step.

### Response:
`.trim();

export const SIXTH_STEP_MESSAGES = (steps: WorkflowMultiStep) => [
  {
    role: 'assistant',
    content: steps[5].toStepString,
  },
  {
    role: 'user',
    content: SIXTH_STEP_PROMPT(),
  },
];

export async function* sixthStepPhase(
  userReq: UserRequest,
  steps: WorkflowMultiStep,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      ...FIRST_STEP_MESSAGES(userReq, steps),
      ...SECOND_STEP_MESSAGES(steps),
      ...THIRD_STEP_MESSAGES(steps),
      ...FOURTH_STEP_MESSAGES(steps),
      ...FIFTH_STEP_MESSAGES(steps),
      ...SIXTH_STEP_MESSAGES(steps),
    ],
  });
}
