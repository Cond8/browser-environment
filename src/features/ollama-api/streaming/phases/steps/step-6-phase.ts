// src/features/ollama-api/streaming/phases/steps/step-6-phase.ts
import { WorkflowMultiStep } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';

export const SIXTH_STEP_PROMPT =
  () => `Create a final step to format the summary into bullet points. The step should:
1. Take the final concerns list and a template configuration
2. Format each concern into a bullet point using the template
3. Return a formatted string with all bullet points

The step should be in this format:
{
  "name": "FormatSummary",
  "module": "format",
  "functionName": "CreateBulletPointsListFromConcerns",
  "goal": "Convert ranked concerns into a bullet-point summary format ready to be presented.",
  "params": {
    "finalConcernsList": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "concernPhrase": {
            "type": "string"
          },
          "occurrencesCount": {
            "type": "number"
          }
        }
      }
    },
    "templateConfig": {
      "type": "object",
      "properties": {
        "format": {
          "type": "string",
          "description": "Template string for formatting each bullet point"
        }
      }
    }
  },
  "returns": {
    "summaryBulletPoints": {
      "type": "string",
      "description": "Formatted string containing all bullet points"
    }
  }
}`;

export const SIXTH_STEP_MESSAGES = (steps: WorkflowMultiStep) => [
  {
    role: 'system',
    content: SIXTH_STEP_PROMPT(),
  },
];

export async function* sixthStepPhase(
  userReq: UserRequest,
  steps: WorkflowMultiStep,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [...SIXTH_STEP_MESSAGES(steps)],
  });
}
