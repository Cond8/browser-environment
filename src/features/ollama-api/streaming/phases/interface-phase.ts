// src/features/ollama-api/streaming/phases/interface-phase.ts
import { dslToJson } from '@/features/editor/transpilers/dsl-to-json';
import { Options } from 'ollama/browser';
import { SYSTEM_PROMPT } from '../../prompts/prompts-system';
import { WorkflowChainError } from '../api/workflow-chain';
import { WorkflowStep } from '../api/workflow-step';

export const INTERFACE_PROMPT = (userRequest: string, alignmentResponse: string) =>
  `
You are an assistant that defines structured **JSDoc-based** workflows.

Your task is to generate the **interface** section as a single JSDoc block.

---
## REQUIRED JSDOC FORMAT

\`\`\`ts
/**
 * <High-level description of this workflow's purpose>
 *
 * @name <PascalCaseWorkflowName>
 * @service <OneOfThePredefinedServicesBelow>
 * @method <snake_case_method_name>
 * @param {string|number|boolean|object|array} param_name - Concise description
 * @returns {string|number|boolean|object|array} return_name - Concise description
 */
\`\`\`

### Rules
1. **@name** must be in **PascalCase**.
2. **@service** must be **one** of the predefined services (see below).
3. **@method** must be **snake_case**.
4. **@param**: use snake_case for \`param_name\`, specify a valid type, add a **1-sentence** description.
5. **@returns**: same as above, with a valid type and short description.
6. **Do not** add any extra code or text beyond the JSDoc block.

---
## AVAILABLE SERVICES
- extract
- parse
- validate
- transform
- logic
- calculate
- format
- io
- storage
- integrate
- understand
- generate

---
## EXAMPLE

\`\`\`ts
/**
 * Processes raw user data and transforms it into a standardized format.
 *
 * @name ProcessUserData
 * @service transform
 * @method transform_user_data
 * @param {string} raw_data - The unprocessed user data
 * @param {string} format_type - The target format specification
 * @returns {string} processed_data - The standardized user data
 */
\`\`\`

---
## USER REQUEST
\`\`\`
${userRequest}
\`\`\`

## APPROVED ALIGNMENT RESPONSE
\`\`\`
${alignmentResponse}
\`\`\`

---
## TASK: Generate the **Interface JSDoc** block
Only output a single JSDoc block that meets the above requirements.
End your response with \`*/\` (this is the stopping point).

---
## IMPORTANT

This interface will be used to generate **exactly 6 JSDoc-formatted steps** that form a linear workflow. Please ensure:
- The goal is clear and actionable
- The inputs and outputs are sufficient to divide into 6 atomic operations

/**
 *
`.trim();

export async function* interfacePhase(
  userRequest: string,
  alignmentResponse: string,
  completionFn: (
    prompt: string,
    options?: Partial<Options>,
  ) => AsyncGenerator<string, string, unknown>,
): AsyncGenerator<string, WorkflowStep, unknown> {
  let response;
  try {
    const prompt = SYSTEM_PROMPT(INTERFACE_PROMPT(userRequest, alignmentResponse));
    console.log('[interfacePhase] Prompt:', prompt);
    response = yield* completionFn(prompt, {
      stop: ['*/'],
    });

    return dslToJson(response);
  } catch (err) {
    throw new WorkflowChainError(
      'Interface generation failed',
      'interface',
      err instanceof Error ? err : undefined,
      { userRequest, alignmentResponse },
    );
  }
}
