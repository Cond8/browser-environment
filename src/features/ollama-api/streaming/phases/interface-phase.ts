// src/features/ollama-api/streaming/phases/interface-phase.ts
import { chatFn } from '../infra/create-chat';
import { UserRequest } from './types';
export const INTERFACE_PROMPT = (userRequest: string) =>
  `
You are an expert in JSON schema design.

You are designing the input/output contract for an entire workflow system.

Think of this as defining a single black box that processes inputs into outputs:
- params: What must go IN to the entire workflow
- returns: What comes OUT of the entire workflow when done

The interface must be a single JSON object with this exact structure:

Rules:
- "name" must be a in PascalCase
- "function" must be a doubleWorded in camelCase
- All field names must be in camelCase
- Use only types: string, number, boolean, array, object
- Keep names concise and avoid multi-worded names
- This interface represents the ENTIRE workflow contract - think of it as a single function that takes inputs and produces outputs
- Define params and returns with meaningful names that describe their specific purpose
- Each param and return should represent a distinct piece of data or configuration

\`\`\`json
{
  "name": "SingleWordWorkflow",
  "module": "Choose one",
  "functionName": "DoubleWorded function",
  "goal": "md summary of the workflow goal",
  "params": {
    // json schema
  },
  "returns": {
    // json schema
  }
}
\`\`\`

Available modules:
- extract, parse, validate, transform, logic, calculate, format, io, storage, integrate, understand, generate

User request: ${userRequest}

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
