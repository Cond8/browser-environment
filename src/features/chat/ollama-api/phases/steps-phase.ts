import { ChatRequest } from 'ollama/browser';
import { parseOrRepairJson } from '../llm-output-fixer';
import { SYSTEM_PROMPT } from '../prompts/prompts-system';
import {
  stepsSchema,
  stepsTool,
  WorkflowService,
  WorkflowStep,
} from '../tool-schemas/workflow-schema';

import { StreamYield, WorkflowChainError, WorkflowValidationError } from '../workflow-chain';

type StreamResponseFn = (
  id: number,
  request: ChatRequest & { stream: true },
) => AsyncGenerator<StreamYield, string, unknown>;

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

export async function* handleStepsPhase(
  content: string,
  id: number,
  interfaceParsed: WorkflowStep,
  streamFn: StreamResponseFn,
  model: string,
  options: any,
): AsyncGenerator<StreamYield, WorkflowStep[], unknown> {
  let response;
  try {
    response = yield* streamFn(id, {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT() + STEPS_PROMPT() },
        { role: 'user', content },
        { role: 'assistant', content: JSON.stringify(interfaceParsed) },
      ],
      tools: [stepsTool],
      options,
      stream: true,
    });
  } catch (err) {
    throw new WorkflowChainError(
      'Steps generation failed',
      'steps',
      err instanceof Error ? err : undefined,
      { content },
    );
  }

  const parsed = parseWithSchema(response, stepsSchema, 'steps');
  const steps = parsed.map((step: WorkflowStep) => ({
    ...step,
    service: step.service as WorkflowService,
  }));
  yield { type: 'text', content: JSON.stringify({ steps }, null, 2), id };
  return steps;
}

function parseWithSchema(response: string, schema: any, phase: 'interface' | 'steps'): WorkflowStep[] {
  try {
    const parsed = parseOrRepairJson<WorkflowStep[]>(response, schema);
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
