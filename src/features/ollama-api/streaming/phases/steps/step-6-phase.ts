import { SYSTEM_PROMPT } from '@/features/ollama-api/streaming/phases/prompts-system';
import { ChatRequest } from 'ollama';
import { WorkflowStep } from '../../api/workflow-step';

export const SIXTH_STEP_PROMPT = () =>
  `
## TASK

Generate the sixth and final formatting step based on the previous steps provided. The format should match the structure of the previous steps.
Output only the JSON for the step.

### Response:
`.trim();

export async function* sixthStepPhase(
  userRequest: string,
  alignmentResponse: string,
  interfaceResponse: WorkflowStep,
  firstStep: WorkflowStep,
  secondStep: WorkflowStep,
  thirdStep: WorkflowStep,
  fourthStep: WorkflowStep,
  fifthStep: WorkflowStep,
  chatFn: (
    request: Omit<ChatRequest, 'model' | 'stream'>,
  ) => AsyncGenerator<string, string, unknown>,
): AsyncGenerator<string, string, unknown> {
  const prompt = SYSTEM_PROMPT(SIXTH_STEP_PROMPT());
  console.log('[sixthStepPhase] Starting step generation with prompt:', prompt);
  return yield* chatFn({
    messages: [
      {
        role: 'system',
        content: prompt,
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
        role: 'assistant',
        content: '```json \n' + JSON.stringify(secondStep, null, 2) + '\n```',
      },
      {
        role: 'assistant',
        content: '```json \n' + JSON.stringify(thirdStep, null, 2) + '\n```',
      },
      {
        role: 'assistant',
        content: '```json \n' + JSON.stringify(fourthStep, null, 2) + '\n```',
      },
      {
        role: 'assistant',
        content: '```json \n' + JSON.stringify(fifthStep, null, 2) + '\n```',
      },
      {
        role: 'user',
        content: 'Generate the sixth step focusing on formatting the final output.',
      },
    ],
  });
}
