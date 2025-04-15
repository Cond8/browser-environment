// src/features/ollama-api/streaming/phases/interface-phase.ts
import { ChatRequest } from 'ollama';
import { WorkflowChainError } from '../api/workflow-chain';
import { SYSTEM_PROMPT } from './prompts-system';

export const INTERFACE_PROMPT = (userRequest: string) =>
  `
You are designing the input/output contract for an entire workflow system.

Think of this as defining a single black box that processes inputs into outputs:
- params: What must go IN to the entire workflow
- returns: What comes OUT of the entire workflow when done

The interface must be a single JSON object with this exact structure:

\`\`\`json
{
  "interface": {
    "name": "SingleWordWorkflow",
    "module": "One of single-worded modules below",
    "function": "DoubleWordedFunction",
    "goal": "md summary of the workflow goal",
    "params": {
      // ... params - json schema
    },
    "returns": {
      // ... returns - json schema
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
- This interface represents the ENTIRE workflow contract - think of it as a single function that takes inputs and produces outputs
- Define params and returns with meaningful names that describe their specific purpose
- Each param and return should represent a distinct piece of data or configuration

User request: ${userRequest}

Output only the raw JSON interface.
`.trim();

export async function* interfacePhase(
  userRequest: string,
  alignmentResponse: string,
  chatFn: (
    request: Omit<ChatRequest, 'model' | 'stream'>,
  ) => AsyncGenerator<string, string, unknown>,
): AsyncGenerator<string, string, unknown> {
  try {
    const prompt = SYSTEM_PROMPT(INTERFACE_PROMPT(userRequest));
    console.log('[interfacePhase] Prompt:', prompt);
    const messages = [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: alignmentResponse,
      },
    ];

    console.log('[interfacePhase] Messages:', messages);

    return yield* chatFn({
      messages,
      options: {
        stop: ['*/'],
      },
    });
  } catch (err) {
    throw new WorkflowChainError(
      'Interface generation failed',
      'interface',
      err instanceof Error ? err : undefined,
      { userRequest, alignmentResponse },
    );
  }
}
