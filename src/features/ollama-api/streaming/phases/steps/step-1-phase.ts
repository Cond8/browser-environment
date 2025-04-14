// src/features/ollama-api/streaming/phases/first-step-phase.ts
export const FIRST_STEP_PROMPT = (
  userRequest: string,
  alignmentResponse: string,
  interfaceResponse: string,
) =>
  `
You are an assistant that helps users define structured workflows using a **JSDoc-based format**.

Each workflow is a sequence of JSDoc comment blocks:
- The **first block** is the workflow interface.
- The **next 4–6 blocks** are individual workflow steps.

---
## FORMAT REQUIREMENTS

Each step must follow this format:

\`\`\`ts
/**
 * <Goal of this specific step>
 *
 * @name <StepName>              // PascalCase, unique
 * @service <service>            // One of the predefined services below
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
## USER REQUEST
\`\`\`
${userRequest}
\`\`\`

## ALIGNMENT RESPONSE
\`\`\`
${alignmentResponse}
\`\`\`

---
## DSL CONTEXT

Below is the interface block. You must now generate the **next JSDoc block**, which defines the **first step** of the workflow:

${interfaceResponse}

/**
 *
`.trim();
