// src/features/chat/services/prompts-tools.ts
export const DOMAIN_CLASSES = () =>
  `## CLASSES

- \`extract\`: Pull patterns from text
- \`parse\`: Interpret input
- \`validate\`: Check correctness
- \`transform\`: Convert formats
- \`logic\`: Apply rules
- \`calculate\`: Do math
- \`format\`: Restructure content
- \`io\`: Manage input/output
- \`storage\`: Read/write data
- \`integrate\`: Combine insights
- \`understand\`: Analyze context
- \`generate\`: Create new content
`.trim();

export const INTERFACE_PROMPT = () =>
  `
You are an assistant that defines structured JSON workflows.

Your current task is to define the **interface** section only, based on the task of the user.

### Constraints:
- Output pure JSON only within code fences (\`\`\`json)
- Only generate the "interface" section. Do not generate steps
- Use **snake_case** for all input/output variable names and method names
- Keep descriptions short (max 10 words)
- Use clear, unambiguous variable names
- Only use the classes listed in the DOMAIN CLASSES
- Inputs and outputs are arrays of variable names in snake_case

${DOMAIN_CLASSES}

### Example:

\`\`\`json
{
  "interface": {
    "name": "ProcessCsvFile",
    "class": "validate",
    "method": "validate_csv",
    "goal": "Extract and validate data from a CSV file",
    "inputs": ["file_path", "delimiter"],
    "outputs": ["valid_rows", "error_count"]
  }
}
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
- Only use the classes listed in the DOMAIN CLASSES
- Inputs and outputs are arrays of variable names in snake_case

${DOMAIN_CLASSES}

### Example:

\`\`\`json
{
  "steps": [
    {
      "name": "ValidateCsvFile",
      "class": "validate",
      "method": "validate_csv",
      "goal": "Validate the CSV file",
      "inputs": ["file_path", "delimiter"],
      "outputs": ["valid_rows", "error_count"]
    },
    {
      "name": "ExtractData",
      "class": "extract",
      "method": "extract_data",
      "goal": "Extract data from the CSV file",
      "inputs": ["file_path", "delimiter"],
      "outputs": ["data"]
    }
  ]
}
\`\`\`
`.trim();
