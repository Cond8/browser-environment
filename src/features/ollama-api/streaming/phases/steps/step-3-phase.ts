// src/features/ollama-api/streaming/phases/steps/step-3-phase.ts
import { WorkflowMultiStep } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';
import { FIRST_STEP_MESSAGES } from './step-1-phase';
import { SECOND_STEP_MESSAGES } from './step-2-phase';

export const THIRD_STEP_PROMPT = () =>
  `
## TASK

Generate the third enrichment step based on the previous steps provided. The format should match the structure of the previous steps.
Output only the JSON for the step.

### Response:
`.trim();

export const THIRD_STEP_MESSAGES = (steps: WorkflowMultiStep) => [
  {
    role: 'assistant',
    content: steps[2].toStepString,
  },
  {
    role: 'user',
    content: THIRD_STEP_PROMPT(),
  },
];

export async function* thirdStepPhase(
  userReq: UserRequest,
  steps: WorkflowMultiStep,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      ...FIRST_STEP_MESSAGES(userReq, steps),
      ...SECOND_STEP_MESSAGES(steps),
      ...THIRD_STEP_MESSAGES(steps),
    ],
  });
}
