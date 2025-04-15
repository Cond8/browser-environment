// src/features/ollama-api/streaming/phases/steps/step-1-phase.ts
import { dslToJson } from '@/features/editor/transpilers-dsl-source/dsl-to-json';
import { jsonToDsl } from '@/features/editor/transpilers-dsl-source/json-to-dsl';
import { SYSTEM_PROMPT } from '@/features/ollama-api/prompts/prompts-system';
import { ChatRequest } from 'ollama';
import { WorkflowChainError } from '../../api/workflow-chain';
import { WorkflowStep } from '../../api/workflow-step';

export const FIRST_STEP_PROMPT = (userRequest: string, alignmentResponse: string) =>
  `
You are an assistant that helps users define structured workflows using a **JSDoc-based format**.

Each workflow is a sequence of exactly **7 JSDoc comment blocks**:
- The **first block** is the workflow interface.
- The **next 6 blocks** are individual validation steps that progressively prepare and check the inputs.

---
## FORMAT REQUIREMENTS

Each step must follow this format:

\`\`\`ts
/**
 * <Goal of this specific step>
 *
 * @name <StepName>              // PascalCase, unique
 * @service <service>            // One of the validation-related services below
 * @method <snake_case_method>   // Describes the action
 * @param {<type>} <param_name> - <Short description>
 * @returns {<type>} <result_name> - <Short description>
 */
\`\`\`

- Use only inputs from the interface or prior steps.
- Types must be one of: \`string\`, \`number\`, \`boolean\`, \`object\`, \`array\`.
- Each tag must be syntactically correct.
- Do NOT output anything other than the next valid JSDoc block.

---
## AVAILABLE SERVICES (Validation-Oriented)

Use one of these for the \`@service\` tag in each step:

- validate
- sanitize
- normalize
- verify
- check
- assert

Each one represents a different aspect of validating or preparing input data.

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

You must now generate the **first validation step**, using \`@service validate\`. Focus on checking required fields and structure.
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
          content: jsonToDsl(interfaceResponse),
        },
      ],
      options: {
        stop: ['*/'],
      },
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
