// src/features/ollama-api/phases/interface-phase.ts
import { ChatRequest } from 'ollama/browser';
import { parseOrRepairJson } from '../llm-output-fixer';
import { SYSTEM_PROMPT } from '../prompts/prompts-system';
import {
  interfaceSchema,
  interfaceTool,
  WorkflowService,
  WorkflowStep,
} from '../tool-schemas/workflow-schema';
import { WorkflowChainError, WorkflowValidationError } from '../workflow-chain';

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

export async function handleInterfacePhase(
  content: string,
  chatFn: (request: Omit<ChatRequest, 'model'>) => Promise<string>,
): Promise<{ interface: WorkflowStep; }> {
  let response;
  try {
    response = await chatFn({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(INTERFACE_PROMPT()) },
        { role: 'user', content },
      ],
      tools: [interfaceTool],
    });
  } catch (err) {
    throw new WorkflowChainError(
      'Interface generation failed',
      'interface',
      err instanceof Error ? err : undefined,
      { content },
    );
  }

  const parsed = parseWithSchema(response, interfaceSchema, 'interface');
  return { interface: { ...parsed, service: parsed.service as WorkflowService } };
}

function parseWithSchema(
  response: string,
  schema: any,
  phase: 'interface' | 'steps',
): WorkflowStep {
  try {
    const parsed = parseOrRepairJson<WorkflowStep>(response, schema);
    if (!parsed) throw new Error('Failed even after repair');
    return parsed;
  } catch (err) {
    throw new WorkflowValidationError(
      `Failed to parse ${phase} JSON`,
      phase,
      [err instanceof Error ? err.message : 'Unknown parsing error'],
      { rawResponse: response },
    );
  }
}
