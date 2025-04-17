// src/features/ollama-api/streaming/phases/interface-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../infra/create-chat';
import { UserRequest } from './types';

export const INTERFACE_PROMPT = (userRequest: string) =>
  `
You are a system interface designer. Define a JSON object that represents the contract for a workflow engine.

This interface must describe:
- What inputs the workflow accepts (\`params\`)
- What outputs it produces (\`returns\`)

Return a **single JSON object** with this exact structure:

{
  "name": "PascalCaseWorkflowName",
  "module": "one of [extract, parse, validate, transform, logic, calculate, format, io, storage, integrate, understand, generate]",
  "functionName": "doubleWordedCamelCaseName",
  "goal": "A markdown-formatted summary of what the workflow does.",
  "params": {
    "inputName": {
      "type": "string",
      "description": "Explanation of this input"
    }
  },
  "returns": {
    "outputName": {
      "type": "string",
      "description": "Explanation of this output"
    }
  }
}

Rules:
- Output only a valid JSON object and nothing else.
- Do not include backticks, markdown formatting, or comments.
- \`name\` must be in PascalCase.
- \`functionName\` must be two words in camelCase.
- All field names must be single words in camelCase.
- Valid types: string, number, boolean, object, array.
- Each field must include both \`type\` and \`description\`.
- Do not use: required, properties, items, enum, default, examples.
- Do not nest schemas or include arrays of objects.

User request:
${userRequest}

Output a single, complete JSON object.
`.trim();

export async function* interfacePhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  console.log('interfacePhase', { userReq, assistantMessage });
  return yield* chatFn({
    messages: [
      {
        role: 'system',
        content: INTERFACE_PROMPT(userReq.userRequest),
      },
      {
        role: 'user',
        content: assistantMessage.alignmentResponse,
      },
    ],
  });
}
