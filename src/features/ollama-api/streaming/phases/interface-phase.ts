// src/features/ollama-api/streaming/phases/interface-phase.ts
import { chatFn } from '../infra/create-chat';
import { UserRequest } from './types';

export const INTERFACE_PROMPT = (userRequest: string) =>
  `
You are an expert in JSON schema design.

You are designing the input/output contract for a workflow engine. Think of this as defining a single function that:
- Takes named inputs via \`params\`
- Produces named outputs via \`returns\`

You must output a single JSON object matching this structure exactly:

\`\`\`json
{
  "name": "PascalCaseWorkflowName",
  "module": "one of [extract, parse, validate, transform, logic, calculate, format, io, storage, integrate, understand, generate]",
  "functionName": "doubleWordedCamelCaseName",
  "goal": "A markdown-formatted summary of the workflow's purpose.",
  "params": {
    "inputName": {
      "type": "string",
      "description": "What this input means."
    }
  },
  "returns": {
    "outputName": {
      "type": "string",
      "description": "What this output means."
    }
  }
}
\`\`\`

Rules:
- Output only a single valid JSON object and nothing else.
- The \`name\` field must be in PascalCase.
- The \`functionName\` must be in camelCase and contain exactly two words.
- Field names inside \`params\` and \`returns\` must be in camelCase.
- Only use types: \`string\`, \`number\`, \`boolean\`, \`object\`, \`array\`.
- Each field must include both \`type\` and \`description\`.
- Do not use: \`required\`, \`properties\`, \`items\`, \`enum\`, \`default\`, or any explanation.
- Do not include arrays of objects or nested schemas.
- Do not wrap the output in triple backticks.

User request: ${userRequest}

Respond with a single JSON object only.
`.trim();

export async function* interfacePhase(
  userReq: UserRequest,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      {
        role: 'system',
        content: INTERFACE_PROMPT(userReq.userRequest),
      },
      {
        role: 'user',
        content: userReq.alignmentResponse,
      },
    ],
  });
}
