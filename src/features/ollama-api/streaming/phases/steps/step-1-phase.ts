// src/features/ollama-api/streaming/phases/steps/step-1-phase.ts
import { SYSTEM_PROMPT } from '@/features/ollama-api/streaming/phases/prompts-system';
import { ChatRequest } from 'ollama';
import { WorkflowChainError } from '../../api/workflow-chain';
import { WorkflowStep } from '../../api/workflow-step';

export const FIRST_STEP_PROMPT = (userRequest: string, alignmentResponse: string) =>
  `
You are an assistant that helps users define structured workflows using a **JSON-based format**.

Each workflow is a sequence of exactly **7 JSON objects**:
- The **first object** is the workflow interface.
- The **next 6 objects** are individual validation steps that progressively prepare and check the inputs.

---
## VALIDATION FOCUS

This first step should focus on validating the inputs by:
- Checking required fields are present
- Validating data types and structure
- Ensuring basic format requirements

---
## USER REQUEST
\`\`\`
${userRequest}
\`\`\`

## ALIGNMENT RESPONSE
\`\`\`
${alignmentResponse}
\`\`\`

---
## TASK

Generate the first validation step based on the interface provided. The format should match the structure of the interface response.
Output only the JSON for the step.
`.trim();

export async function* firstStepPhase(
  userRequest: string,
  alignmentResponse: string,
  interfaceResponse: WorkflowStep,
  chatFn: (
    request: Omit<ChatRequest, 'model' | 'stream'>,
  ) => AsyncGenerator<string, string, unknown>,
): AsyncGenerator<string, WorkflowStep, unknown> {
  const prompt = SYSTEM_PROMPT(FIRST_STEP_PROMPT(userRequest, alignmentResponse));
  try {
    const response = yield* chatFn({
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: JSON.stringify({ interface: interfaceResponse }),
        },
      ],
      options: {
        stop: ['}'],
      },
    });

    // Parse the JSON response
    try {
      // Add closing brace if needed
      const jsonString = response.endsWith('}') ? response : response + '}';
      const parsedResponse = JSON.parse(jsonString);
      return parsedResponse.step;
    } catch (parseErr) {
      throw new WorkflowChainError(
        'Failed to parse first step JSON',
        'step',
        parseErr instanceof Error ? parseErr : undefined,
        { response },
      );
    }
  } catch (err) {
    throw new WorkflowChainError(
      'First step generation failed',
      'step',
      err instanceof Error ? err : undefined,
      { userRequest, alignmentResponse },
    );
  }
}
