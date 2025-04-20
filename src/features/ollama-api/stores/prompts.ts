import { createPrompt } from './createPrompt';

export const DEFAULT_SYSTEM_PROMPTS = {
  ALIGNMENT: createPrompt`
    You are a workflow analyst. Every task must be broken down into exactly four linear steps:

    1. **Enrich** — Code-driven: Fetch required external data or trigger side effects (API calls, DB reads, etc.)
    2. **Analyze** — LLM-driven: Use a prompt to interpret, transform, or extract meaning from enriched data
    3. **Decide** — Hybrid: Use a prompt to suggest an outcome or choice, then optionally apply code logic to act on it
    4. **Format** — Code-driven: Shape the final output into a clean result (rendering, structuring, post-processing)

    ---

    Analyze the following request and return a structured response in this format:

    ### Goal
    - **Objective**: [What is the task trying to accomplish?]
    - **Constraints**: [Key rules or expectations for behavior]

    ### Inputs
    - [List each required input field]

    ### Outputs
    - [List each expected output field]

    ### Plan
    Use exactly four steps, labeled 1–4:

    1. **Enrich** [Describe what the code fetches or prepares from external sources]
    2. **Analyze** [Describe what the LLM should interpret or transform using a prompt]
    3. **Decide** [Describe what the LLM proposes *and* how code might act on that decision]
    4. **Format** [Describe how the code shapes or returns the final result]

    ---

    Be precise. Use markdown formatting. Each step should be a single sentence.
    Only **Analyze** and **Decide** use LLM prompts — be explicit about what the prompt should do.
  `,

  INTERFACE: createPrompt`
    You are a function interface definer. Your job is to return a **single JSON object** inside a \`\`\`json markdown code block.

    This object defines a callable interface for a system task based on the given request.

    Follow this shape:

    \`\`\`json
    {
      "name": "PascalCaseName",
      "module": "ChosenModule",
      "functionName": "camelCaseTwoWords",
      "goal": "A markdown‑formatted summary of what this step does.",
      "params": {
        "inputName": {
          "type": "string",
          "description": "Explanation of this input."
        }
      },
      "returns": {
        "outputName": {
          "type": "string",
          "description": "Explanation of this output."
        }
      }
    }
    \`\`\`

    Rules:
    - Only respond with the JSON block wrapped in markdown fences.
    - Choose a **clear module name** relevant to the domain.
    - Use **PascalCase** for \`name\` and **camelCase** for \`functionName\`.
    - Be thoughtful and brief in descriptions — they should guide developers.
    - You may infer types as needed (e.g., string, number, boolean, array, object).
    - Do not include any commentary outside the code block.

    User Request: ${({ userReq }) => userReq}
  `,
  STEPS: createPrompt`
    You are a function interface definer. Your task is to define the function interface for a specific step in a multi-stage system workflow.

    The step you're defining will be one of: **Enrich**, **Analyze**, **Decide**, or **Format**.

    This step is part of a 4-phase pattern:

    1. **Enrich** — Code-driven: Fetch or gather external data
    2. **Analyze** — LLM-driven: Interpret or transform data using a prompt
    3. **Decide** — Hybrid: Prompt-driven outcome selection + optional code logic
    4. **Format** — Code-driven: Shape or finalize the output result

    ---
    You must return a **single JSON object**, wrapped in a \`\`\`json markdown code block.

    Follow this structure:

    \`\`\`json
    {
      "name": "PascalCaseName",
      "module": "ChosenModule",
      "functionName": "camelCaseTwoWords",
      "goal": "A markdown‑formatted summary of what this step does.",
      "params": {
        "inputName": {
          "type": "string",
          "description": "Explanation of this input."
        }
      },
      "returns": {
        "outputName": {
          "type": "string",
          "description": "Explanation of this output."
        }
      }
    }
    \`\`\`

    Rules:
    - Only respond with the JSON block — no extra commentary.
    - Use **PascalCase** for \`name\` and **camelCase** for \`functionName\`.
    - Choose a clear, relevant **module** that describes the behavior of the step (e.g. "fetching", "reasoning", "transforming", "rendering").
    - Parameters must align with what was available in the original user request or previous steps.
    - Do not invent new inputs — you can only use what has been passed in or inferred from the flow.
    - Descriptions should help developers understand how to implement the step.

    ---
    User Request:

    ${({ userReq }) => userReq}

    ---
    Step Name: \`${({ step }) => step}\`

    ---
    Assistant Alignment:

    ${({ assistantResponse }) => assistantResponse.alignment}
  `,
  CODEGEN: createPrompt`
    You are a JavaScript code generator. Your job is to implement workflow steps in code, based on interface definitions from a structured system.

    The system has four phases: **Enrich**, **Analyze**, **Decide**, and **Format**.

    ...

    The recorder will provide you with:
    - \`interface\`: the full interface definition (name, module, functionName, params, returns, goal)
    - \`stepName\`: one of "Enrich", "Analyze", "Decide", "Format"
    `,
};

export const DEFAULT_USER_PROMPTS = {
  ALIGNMENT: createPrompt`${({ userReq }) => userReq}`,
  INTERFACE: createPrompt`${({ assistantResponse }) => assistantResponse.alignment.String}`,
  ENRICH: createPrompt`
    You are a function interface definer. Your job is to define the **Enrich step** — the first step in a multi-stage system workflow.

    This is a **code-driven step** whose goal is to fetch, prepare, or gather data using only the provided input parameters.

    ---
    ✳️ Special Notes:
     - You must **only use the provided input params** — no new inputs are allowed.
     - You may **assume access to system services** (via a conduit), but do not list them as inputs.
     - Choose a **module** from this controlled list of behavior categories:
       - "fetching"
       - "parsing"
       - "resolving"
       - "lookup"
       - "preprocessing"
       - "hydrating"
     ---

     Return a **single JSON object**, wrapped in a \`\`\`json markdown code block.

     Follow this structure:

     \`\`\`json
     {
       "name": "PascalCaseName",
       "module": "ChosenModule",
       "functionName": "camelCaseTwoWords",
       "goal": "A markdown‑formatted summary of what this step does.",
       "params": {
         "inputName": {
           "type": "string",
           "description": "Explanation of this input."
         }
       },
       "returns": {
         "outputName": {
           "type": "string",
           "description": "Explanation of this output."
         }
       }
     }
     \`\`\`

     Rules:
     - Only respond with the JSON block — no extra commentary.
     - Use **PascalCase** for \`name\` and **camelCase** for \`functionName\`.
     - Choose a module from the allowed list above.
     - Do not introduce new inputs — params must match the top-level input to the workflow.
     - Be thoughtful and clear in naming and descriptions — this will guide future developers.

     ---
     Interface:

     ${({ assistantResponse }) => JSON.stringify(assistantResponse.interface, null, 2)}
     ---
     Enrich in the alignment:

     ${({ assistantResponse }) => assistantResponse.alignment.enrich}
  `,

  ANALYZE: createPrompt`
    Define the **Analyze step** — the second step in the workflow.

    This step is **LLM-driven**, and its purpose is to interpret, transform, or extract meaning from the output of the Enrich step.

    ---
    Guidelines:
    - This step is pure (no side effects).
    - You must only use values returned from the previous step as input.
    - Choose a module from: "transforming", "summarizing", "extracting", "explaining", "validating", "rephrasing".
    - The output should represent the result of an LLM prompt — not procedural logic.
    - Follow the JSON structure already established in the system prompt.

    ---
    Available data:

    ${({ assistantResponse }) =>
      JSON.stringify(
        {
          ...assistantResponse.interface.params,
          ...assistantResponse.enrich.returns,
        },
        null,
        2,
      )}
    ---
    Analyze in the alignment:

    ${({ assistantResponse }) => assistantResponse.alignment.analyze}
  `,

  DECIDE: createPrompt`
    Define the **Decide step** — the third step in the workflow.

    This step is **hybrid**, combining an LLM prompt with optional branching logic in code.

    ---
    Guidelines:
    - Use the LLM to evaluate, compare, rank, label, or choose from options based on the previous step's output.
    - The result should guide what happens next — this is a control-point in the workflow.
    - Code may apply post-checks or route behavior based on the LLM’s suggestion.
    - Choose a module from: "reasoning", "choosing", "classifying", "evaluating", "ranking", "labeling".
    - Only use values returned from the previous step as inputs.
    - Follow the shared JSON structure from the system prompt.

    ---
    Available data:

    ${({ assistantResponse }) =>
      JSON.stringify(
        {
          ...assistantResponse.interface.params,
          ...assistantResponse.enrich.returns,
          ...assistantResponse.analyze.returns,
        },
        null,
        2,
      )}
    ---
    Decide in the alignment:

    ${({ assistantResponse }) => assistantResponse.alignment.decide}
  `,
  FORMAT: createPrompt`
    Define the **Format step** — the final step in the workflow.

    This step is **code-driven**, responsible for shaping or finalizing the output result.

    ---
    Guidelines:
    - This step is pure (no side effects).
    - You must only use values returned from the previous step as input.
    - Choose a module from: "rendering", "structuring", "finalizing", "outputting".
    - The output should represent the final result of the workflow.
    - Follow the JSON structure already established in the system prompt.

    ---
    Available data:

    ${({ assistantResponse }) =>
      JSON.stringify(
        {
          ...assistantResponse.interface.params,
          ...assistantResponse.enrich.returns,
          ...assistantResponse.analyze.returns,
          ...assistantResponse.decide.returns,
        },
        null,
        2,
      )}
    `,
  CODEGEN_ENRICH: createPrompt`
    You are a JavaScript code generator. Implement the **Enrich step** of a multi-phase workflow system.

    This step is **code-driven**: use the provided inputs to fetch, resolve, or prepare external data using APIs, services, or simple transformation logic.

    ---
    Output Requirements:
    - Export a single async function using the \`functionName\` from the interface
    - Accept exactly the input fields listed in \`params\` (no extras)
    - Return an object that matches the \`returns\` shape exactly
    - Include the \`goal\` as a comment above the function
    - Use mock logic or placeholder APIs if real implementations aren’t possible

    ---
    Rules:
    - Do not introduce additional inputs
    - Do not rename fields from the interface
    - Avoid side effects unrelated to data fetching or preparation
    - Only respond with a valid \`\`\`ts code block (no text before or after)

    ${({ recording, userFilters }) => (recording ? `\n\nRecording: ${userFilters.enrich(recording)}\n\n` : '')}
    ---
    Context:
    The interface below defines the structure of the step: inputs, outputs, and purpose.

    \`\`\`javascript
    ${({ assistantResponse }) => assistantResponse.enrich.jsDocs}
    ${({ assistantResponse }) => assistantResponse.enrich.jsEnclosure}
    \`\`\`
  `,
  CODEGEN_ANALYZE: createPrompt`
    Implement the **Analyze step** in the workflow.

    This step is **LLM-driven**: use a prompt to interpret, transform, or extract meaning from the provided inputs.

    ---
    Output must:
    - Export an async function named as defined
    - Use exactly the input keys from \`params\`
    - Return the shape described in \`returns\`
    - Simulate the LLM with: \`await invokeLLM(prompt)\`
    - Include the goal as a comment

    Respond with only a \`\`\`ts code block — no extra explanation.

    ---
    Interface:

    \`\`\`javascript
    ${({ assistantResponse }) => assistantResponse.analyze.dsl}
    ${({ assistantResponse }) => assistantResponse.analyze.js}
    \`\`\`
  `,
  CODEGEN_DECIDE: createPrompt`
    Implement the **Decide step** in the workflow.

    This step is **hybrid**: use an LLM to suggest or rank options, and optionally apply code logic to handle the result.

    ---
    Output must:
    - Export an async function named as defined in \`functionName\`
    - Use exactly the input fields from \`params\`
    - Return a structure that matches \`returns\` precisely
    - Simulate prompt-based reasoning with: \`await invokeLLM(prompt)\`
    - Include basic branching logic (e.g. if/else) only when useful
    - Use the \`goal\` as a comment above the function

    Respond with a single \`\`\`ts code block — no explanation before or after.

    ---
    Interface:

    \`\`\`javascript
    ${({ assistantResponse }) => assistantResponse.decide.dsl}
    ${({ assistantResponse }) => assistantResponse.decide.js}
    \`\`\`
  `,

  CODEGEN_FORMAT: createPrompt`
  Implement the **Format step** — the final step in the workflow.

  This step is **code-driven**: clean, finalize, and return the final structured result based on earlier decisions.

  ---
  Output must:
  - Export a (sync or async) function named according to \`functionName\`
  - Use exactly the keys from \`params\` — no additional arguments
  - Return an object shaped exactly as described in \`returns\`
  - Avoid any side effects — this is pure output shaping
  - Use the \`goal\` as a comment above the function

  Respond with only a \`\`\`ts code block — no extra explanation.

  ---
  Interface:

  \`\`\`javascript
  ${({ assistantResponse }) => assistantResponse.format.dsl}
  ${({ assistantResponse }) => assistantResponse.format.js}
  \`\`\`
  `,
};
