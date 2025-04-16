import { SYSTEM_PROMPT } from '@/features/ollama-api/streaming/phases/prompts-system';
import { ChatRequest } from 'ollama';
import { WorkflowStep } from '../../api/workflow-step';
import { THIRD_STEP_PROMPT } from './step-3-phase';
import { SECOND_STEP_PROMPT } from './step-2-phase';
import { FIRST_STEP_PROMPT } from './step-1-phase';
import { chatFn } from '../../infra/create-chat';

export const FOURTH_STEP_PROMPT = () =>
  `
## TASK

Generate the fourth analysis step based on the previous steps provided. The format should match the structure of the previous steps.
Output only the JSON for the step.

### Response:
`.trim();

export async function* fourthStepPhase(
  userRequest: string,
  alignmentResponse: string,
  interfaceResponse: WorkflowStep,
  firstStep: WorkflowStep,
  secondStep: WorkflowStep,
  thirdStep: WorkflowStep,
): AsyncGenerator<string, string, unknown> {
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
      {
        role: 'assistant',
        content: '```json \n' + JSON.stringify(secondStep, null, 2) + '\n```',
      },
      {
        role: 'user',
        content: THIRD_STEP_PROMPT(),
      },
      {
        role: 'assistant',
        content: '```json \n' + JSON.stringify(thirdStep, null, 2) + '\n```',
      },
      {
        role: 'user',
        content: FOURTH_STEP_PROMPT(),
      },
    ],
  });
}
