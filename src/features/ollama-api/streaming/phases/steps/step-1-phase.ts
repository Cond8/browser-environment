// src/features/ollama-api/streaming/phases/steps/step-1-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';

export const SYSTEM_PROMPT = (userRequest: string, interfaceResponse: string) =>
  `
You are an assistant that helps users define structured workflows using a **JSON-based format**.

Each workflow is a sequence of exactly **7 JSON objects**:
- The **first object** is the workflow interface.
- The **next 6 objects** are individual validation steps that progressively prepare and check the inputs.

The first step must be a JSON object with this exact structure:

\`\`\`json-schema
{
  "name": "ValidateForm",
  "module": "input_validation",
  "functionName": "validate form inputs",
  "goal": "This workflow verifies that incoming user-submitted form fields meet expected formats, types, and required presence, returning detailed validation results per field.",
  "params": {
    "formData": {
      "type": "object",
      "description": "The object representing raw form input submitted by the user."
    },
    "schema": {
      "type": "object",
      "description": "A validation schema object defining required fields, types, and rules."
    },
    "context": {
      "type": "string",
      "description": "An optional tag describing the form’s usage context (e.g., 'signup', 'profile_update')."
    }
  },
  "returns": {
    "isValid": {
      "type": "boolean",
      "description": "Whether all validations passed successfully."
    },
    "errors": {
      "type": "array",
      "description": "An array of validation error messages for each failed field."
    },
    "validatedData": {
      "type": "object",
      "description": "A sanitized and type-safe version of the form data."
    }
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
${interfaceResponse}
\`\`\`

---
## TASK

Generate the first validation step based on the interface provided. The format should match the structure of the interface response.
Output only the JSON for the step.

### Response:
`.trim();

export const FIRST_STEP_MESSAGES = (userReq: UserRequest, assistantMessage: AssistantMessage) => [
  {
    role: 'system',
    content: SYSTEM_PROMPT(userReq.userRequest, assistantMessage.interfaceString),
  },
  {
    role: 'user',
    content: userReq.alignmentResponse,
  },
];

export async function* firstStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({ messages: FIRST_STEP_MESSAGES(userReq, assistantMessage) });
}
