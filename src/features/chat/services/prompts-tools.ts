// src/features/chat/services/prompts-tools.ts
export const INTERFACE_PROMPT = (userMessage: string) =>
  `
You are an assistant that defines structured YAML workflows.

Your current task is to define the **interface** section only, based on the following task:

"${userMessage.trim()}"

### Interface Format:
interface:
  name: CamelCaseName
  goal: Short description of the workflow's purpose
  input:
    - variable (brief comment)
  output:
    - variable (brief comment)
  class: one of the valid domain classes
  method: camelCaseMethod (optional short comment)

### Constraints:
- Output only valid YAML (no comments, no Markdown, no prose).
- Only generate the "interface" section. Do not generate steps.
- Prefer **programmatic** classes unless the task requires inference or language understanding.
- Keep inline comments short (max 10 words).
- Use clear, unambiguous variable names.

### Available Classes:
#### programmatic
- Simple: data, validate, io, storage, logic
- Complex: parse, control, auth, notify, schedule, optimize, calculate, network, encrypt

#### llm_based
- Simple: extract, format, understand
- Complex: process, generate, integrate, predict, transform
`.trim();

export const STEPS_PROMPT = (interfaceYaml: string) =>
  `
You are an assistant that defines structured YAML workflows.

You are given the following workflow interface:

${interfaceYaml.trim()}

Your task is to generate the **steps** section of the YAML workflow.

### Step Format:
steps:
  - name: CamelCaseName
    goal: One clear purpose
    input:
      - variable (brief comment)
    output:
      - variable (brief comment)
    class: valid domain class
    method: camelCaseMethod (optional short comment)

### Constraints:
- Generate 8 to 12 steps maximum.
- Do NOT include the interface section again.
- Each step must be atomic and sequentially logical.
- Final step must produce all interface outputs.
- Prefer programmatic classes unless subjective reasoning is required.
- Use clean, readable YAML only. No Markdown or commentary.
`.trim();
