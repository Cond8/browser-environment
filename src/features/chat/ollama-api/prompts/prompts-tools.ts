// src/features/chat/services/prompts-tools.ts
export const DOMAIN_CLASSES_PROMPT = () =>
  `## DOMAIN CLASSES

### LLM-Centric
- \`extract\`: Pull patterns from text
- \`format\`: Restructure content
- \`understand\`: Analyze context
- \`process\`: Transform with reasoning
- \`generate\`: Create new content
- \`integrate\`: Combine insights
- \`predict\`: Forecast outcomes
- \`transform\`: Convert formats

### Programmatic
- \`data\`: Handle structured data
- \`validate\`: Check correctness
- \`io\`: Manage input/output
- \`storage\`: Read/write data
- \`logic\`: Apply rules
- \`parse\`: Interpret input
- \`control\`: Manage flow
- \`auth\`: Handle permissions
- \`notify\`: Send alerts
- \`schedule\`: Manage timing
- \`optimize\`: Improve efficiency
- \`calculate\`: Do math
- \`network\`: Call APIs
- \`encrypt\`: Secure data
`.trim();

export const INTERFACE_PROMPT = () =>
  `
You are an assistant that defines structured YAML workflows.

Your current task is to define the **interface** section only, based on the task of the user.

### Example:

\`\`\`yaml
interface:
  name: ProcessCsvFile
  goal: Extract and validate data from a CSV file
  input:
    - file_path: path to the CSV file
    - delimiter: character separating columns
  output:
    - valid_rows: list of validated data rows
    - error_count: number of invalid rows
  class: data
  method: validate_csv
\`\`\`
${DOMAIN_CLASSES_PROMPT}

### Constraints:
- Output pure YAML only within code fences (\`\`\`yaml)
- Only generate the "interface" section. Do not generate steps
- Prefer **programmatic** classes unless the task requires inference or language understanding
- Use **snake_case** for all input/output variable names and method names
- Keep inline comments short (max 10 words)
- Use clear, unambiguous variable names
`.trim();

export const STEPS_PROMPT = () =>
  `
You are an assistant that defines structured YAML workflows.

You will be given the interface section of a YAML workflow.

Your task is to generate the **steps** section of the YAML workflow.

${DOMAIN_CLASSES_PROMPT}

### Constraints:
- Output pure YAML only within code fences (\`\`\`yaml)
- Generate 8 to 12 steps maximum
- Do NOT include the interface section again
- Each step must be atomic and sequentially logical
- Final step must produce all interface outputs
- Use **snake_case** for all variable and method names
- Prefer programmatic classes unless subjective reasoning is required

### Example:

\`\`\`	yaml
steps:
  - name: ValidateCsvFile
    goal: Validate the CSV file
    input:
      - file_path: path to the CSV file
      - delimiter: character separating columns
    output:
      - valid_rows: list of validated data rows
      - error_count: number of invalid rows
    class: data
    method: validate_csv

  - name: ExtractData
    goal: Extract data from the CSV file
    input:
      - file_path: path to the CSV file
      - delimiter: character separating columns
    output:
      - data: list of data rows
    class: data
    method: extract_data
\`\`\`
`.trim();
