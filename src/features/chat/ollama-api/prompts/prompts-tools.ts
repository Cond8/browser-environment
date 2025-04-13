// src/features/chat/services/prompts-tools.ts
export const DOMAIN_SERVICES = () =>
  `## SUGGESTED SERVICES
  Use these as a guide for the \`service\` field. The system will automatically use the *first word* of the service you provide.

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

Your task is to generate the **interface** section of a JSON workflow.

### Required Fields:
- name: PascalCase name for the workflow
- service: One of the predefined services (see below)
- method: snake_case method name
- goal: Clear description of the workflow's purpose
- inputs: Array of input variable names in snake_case
- outputs: Array of output variable names in snake_case

### AVAILABLE SERVICES
You must use one of these predefined services:
- extract: Extract specific data or information from input
- parse: Parse and interpret structured data
- validate: Validate data against rules or constraints
- transform: Transform data from one format to another
- logic: Apply business logic or decision making
- calculate: Perform mathematical calculations
- format: Format data for presentation
- io: Handle input/output operations
- storage: Manage data storage operations
- integrate: Integrate with external systems
- understand: Analyze and understand content
- generate: Generate new content or data

### Example:

\`\`\`json
{
  "name": "ProcessUserData",
  "service": "transform",
  "method": "transform_user_data",
  "goal": "Transform raw user data into standardized format",
  "inputs": ["raw_data", "format_type"],
  "outputs": ["processed_data"]
}
\`\`\`

## Task: Generate Workflow Interface
Based on the user's request, generate a complete interface definition with ALL required fields.

RULES:
- The \`service\` field MUST be one of the predefined services listed above
- The \`method\` field MUST be in snake_case
- The \`name\` field MUST be in PascalCase
- Inputs and outputs MUST be arrays of variable names in snake_case
`.trim();

export const STEPS_PROMPT = () =>
  `
You are an assistant that defines structured JSON workflows.

You will be given the interface section of a JSON workflow.

Your task is to generate the **steps** section of the JSON workflow.

### Required Format:
- Output MUST start with \`\`\`json and end with \`\`\`
- Output MUST be a valid JSON array of step objects
- Each step MUST have ALL required fields
- Do NOT include any explanatory text before or after the JSON

### Required Fields for Each Step:
- name: PascalCase name for the step
- service: One of the predefined services (see below)
- method: snake_case method name
- goal: Clear description of the step's purpose
- inputs: Array of input variable names in snake_case
- outputs: Array of output variable names in snake_case

### AVAILABLE SERVICES
You must use one of these predefined services:
- extract: Extract specific data or information from input
- parse: Parse and interpret structured data
- validate: Validate data against rules or constraints
- transform: Transform data from one format to another
- logic: Apply business logic or decision making
- calculate: Perform mathematical calculations
- format: Format data for presentation
- io: Handle input/output operations
- storage: Manage data storage operations
- integrate: Integrate with external systems
- understand: Analyze and understand content
- generate: Generate new content or data

### Example:

\`\`\`json
[
  {
    "name": "ValidateInput",
    "service": "validate",
    "method": "validate_email_content",
    "goal": "Validate the email content format",
    "inputs": ["email_body"],
    "outputs": ["validated_content"]
  },
  {
    "name": "AnalyzeContent",
    "service": "understand",
    "method": "analyze_email_patterns",
    "goal": "Analyze email content for spam patterns",
    "inputs": ["validated_content"],
    "outputs": ["spam_score"]
  }
]
\`\`\`

## Task: Generate Workflow Steps
Based on the provided interface, generate a sequence of steps to accomplish the goal.

RULES:
- Generate 2-4 steps maximum
- Each step MUST have ALL required fields
- Steps MUST be logically connected
- Final step MUST produce the interface's outputs
- Do NOT include any text before or after the JSON
`.trim();
