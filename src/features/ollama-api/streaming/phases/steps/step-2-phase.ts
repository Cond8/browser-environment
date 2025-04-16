// src/features/ollama-api/streaming/phases/steps/step-2-phase.ts
import { WorkflowMultiStep } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';
import { FIRST_STEP_MESSAGES } from './step-1-phase';

export const SECOND_STEP_PROMPT = () =>
  `
## TASK

Generate the second extraction step based on the previous step provided. The format should match the structure of the previous step.
Output only the JSON for the step.

### Response:
`.trim();

export const SECOND_STEP_MESSAGES = (steps: WorkflowMultiStep) => [
  {
    role: 'assistant',
    content: steps[1].toStepString,
  },
  {
    role: 'user',
    content: SECOND_STEP_PROMPT(),
  },
];

export async function* secondStepPhase(
  userReq: UserRequest,
  steps: WorkflowMultiStep,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [...FIRST_STEP_MESSAGES(userReq, steps), ...SECOND_STEP_MESSAGES(steps)],
  });
}
