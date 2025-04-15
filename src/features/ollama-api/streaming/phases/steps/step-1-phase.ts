// src/features/ollama-api/streaming/phases/steps/step-1-phase.ts
import { SYSTEM_PROMPT } from '@/features/ollama-api/streaming/phases/prompts-system';
import { ChatRequest } from 'ollama';
import { WorkflowChainError } from '../../api/workflow-chain';
import { WorkflowStep } from '../../api/workflow-step';

export const FIRST_STEP_PROMPT = (userRequest: string, interfaceResponse: WorkflowStep) =>
  `
You are an assistant that helps users define structured workflows using a **JSON-based format**.

Each workflow is a sequence of exactly **7 JSON objects**:
- The **first object** is the workflow interface.
- The **next 6 objects** are individual validation steps that progressively prepare and check the inputs.

The first step must be a JSON object with this exact structure:

\`\`\`json
{
  "name": "SingleWordStep",
  "module": "Choose one",
  "function": "DoubleWorded function",
  "goal": "md summary of the step goal",
  "params": {
    // ... params - json schema
  },
  "returns": {
    // ... returns - json schema
  }
}
\`\`\`

Available modules:
- extract, parse, validate, transform, logic, calculate, format, io, storage, integrate, understand, generate

Rules:
- "name" must be a single word in PascalCase
- "function" must be a single word in camelCase
- All field names must be single words in camelCase
- Use only types: string, number, boolean, array, object
- Keep names concise and avoid multi-worded names
- This step represents the first validation in the workflow
- Define params and returns with meaningful names that describe their specific purpose
- Each param and return should represent a distinct piece of data or configuration

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

## WORKFLOW INTERFACE
\`\`\`
${JSON.stringify(interfaceResponse, null, 2)}
\`\`\`

---
## TASK

Generate the first validation step based on the interface provided. The format should match the structure of the interface response.
Output only the JSON for the step.

### Response:
`.trim();

export async function* firstStepPhase(
  userRequest: string,
  alignmentResponse: string,
  interfaceResponse: WorkflowStep,
  chatFn: (
    request: Omit<ChatRequest, 'model' | 'stream'>,
  ) => AsyncGenerator<string, string, unknown>,
): AsyncGenerator<string, string, unknown> {
  const prompt = SYSTEM_PROMPT(FIRST_STEP_PROMPT(userRequest, interfaceResponse));
  console.log('[firstStepPhase] Starting step generation with prompt:', prompt);
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
    ],
  });
}
