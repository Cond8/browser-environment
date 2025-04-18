// src/features/ollama-api/streaming-logic/phases/interface-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { UserRequest } from '@/features/ollama-api/streaming-logic/phases/types';
import { JSON_RULES } from './rules';

export const INTERFACE_PROMPT = (userRequest: string) =>
  `
You are a system interface designer. Define a JSON object that represents the contract for a workflow engine.

This interface must describe:
- What inputs the workflow accepts (\`params\`)
- What outputs it produces (\`returns\`)

Return a **single JSON object** with this exact structure:

{
  "name": "PascalCaseWorkflowName",
  "module": "one of [modules]",
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

${JSON_RULES}
- \`name\` must be in PascalCase.
- \`functionName\` must be two words in camelCase.
- All field names must be single words in camelCase.
- Valid types: string, number, boolean, object, array.
- Each field must include both \`type\` and \`description\`.
- Do not use: required, properties, items, enum, default, examples.
- Do not nest schemas or include arrays of objects.

User request:
${userRequest}

Output a single, complete JSON object. Surrounded by \`\`\`json and \`\`\`.
`.trim();

export const INTERFACE_MESSAGES = (
  userRequest: UserRequest,
  assistantMessage: AssistantMessage,
) => [
  {
    role: 'system',
    content: INTERFACE_PROMPT(userRequest.userRequest),
  },
  {
    role: 'user',
    content: assistantMessage.alignmentResponse,
  },
];
