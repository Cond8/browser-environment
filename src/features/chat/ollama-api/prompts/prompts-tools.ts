// src/features/chat/services/prompts-tools.ts
export const DOMAIN_CLASSES = () =>
  `## CLASSES

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
You are an assistant that defines structured JSON workflows.

Your current task is to define the **interface** section only, based on the task of the user.

### Constraints:
- Output pure JSON only within code fences (\`\`\`json)
- Only generate the "interface" section. Do not generate steps
- Prefer **programmatic** classes unless the task requires inference or language understanding
- Use **snake_case** for all input/output variable names and method names
- Keep descriptions short (max 10 words)
- Use clear, unambiguous variable names
- Only use the classes listed in the DOMAIN CLASSES

${DOMAIN_CLASSES}

### Example:

\`\`\`json
{"interface":{"name":"ProcessCsvFile","class":"validate","method":"validate_csv","goal":"Extract and validate data from a CSV file","inputs":[{"file_path":"path to the CSV file"},{"delimiter":"character separating columns"}],"outputs":[{"valid_rows":"list of validated data rows"},{"error_count":"number of invalid rows"}]}}
\`\`\`
`.trim();

export const STEPS_PROMPT = () =>
  `
You are an assistant that defines structured JSON workflows.

You will be given the interface section of a JSON workflow.

Your task is to generate the **steps** section of the JSON workflow.

### Constraints:
- Output pure JSON only within code fences (\`\`\`json)
- Generate 4 to 6 steps maximum
- Do NOT include the interface section again
- Each step must be atomic and sequentially logical
- Final step must produce all interface outputs
- Use **snake_case** for all variable and method names
- Prefer programmatic classes unless subjective reasoning is required
- Only use the classes listed in the DOMAIN CLASSES

${DOMAIN_CLASSES}

### Example:

\`\`\`json
{"steps":[{"name":"ValidateCsvFile","class":"validate","method":"validate_csv","goal":"Validate the CSV file","inputs":[{"file_path":"path to the CSV file"},{"delimiter":"character separating columns"}],"outputs":[{"valid_rows":"list of validated data rows"},{"error_count":"number of invalid rows"}]},{"name":"ExtractData","class":"extract","method":"extract_data","goal":"Extract data from the CSV file","inputs":[{"file_path":"path to the CSV file"},{"delimiter":"character separating columns"}],"outputs":[{"data":"list of data rows"}]}]}
\`\`\`
`.trim();
