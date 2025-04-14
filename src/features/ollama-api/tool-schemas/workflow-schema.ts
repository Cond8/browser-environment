// src/features/ollama-api/tool-schemas/workflow-schema.ts
import { Tool } from 'ollama';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const SERVICES = [
  'extract',
  'parse',
  'validate',
  'transform',
  'logic',
  'calculate',
  'format',
  'io',
  'storage',
  'integrate',
  'understand',
  'generate',
] as const;

export type WorkflowService = (typeof SERVICES)[number];

export type Workflow = {
  interface: WorkflowStep;
  steps: WorkflowStep[];
};

export type WorkflowStep = {
  name: string;
  service: WorkflowService;
  method: string;
  goal: string;
  /** Record of parameter names to their type and description in the format "type - description" */
  params?: Record<string, string>;
  /** Record of return value names to their type and description in the format "type - description" */
  returns?: Record<string, string>;
};

// Helper functions for validation
const pascalCaseRegex = /^[A-Z][a-zA-Z0-9]*$/;
const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

// Base schemas for reuse
const nameSchema = z
  .string()
  .min(1)
  .regex(pascalCaseRegex, 'Name must be in PascalCase (e.g. ProcessUserData)');

const methodSchema = z
  .string()
  .min(1)
  .regex(snakeCaseRegex, 'Method must be in snake_case (e.g. transform_user_data)');

const variableNameSchema = z
  .string()
  .min(1)
  .regex(snakeCaseRegex, 'Variable name must be in snake_case (e.g. user_data)');

const goalSchema = z.string().min(1).describe('Short, clear task summary');

// Base step schema (used for both interface and steps)
const stepSchema = z.object({
  name: nameSchema,
  service: z.enum(SERVICES),
  method: methodSchema,
  goal: goalSchema,
  params: z
    .record(
      variableNameSchema,
      z
        .string()
        .regex(
          /^(string|number|boolean|function|object|array) - .+/i,
          'Type must be followed by a comment',
        ),
    )
    .optional(),
  returns: z
    .record(
      variableNameSchema,
      z
        .string()
        .regex(
          /^(string|number|boolean|function|object|array) - .+/i,
          'Type must be followed by a comment',
        ),
    )
    .optional(),
});

// Interface schema
const interfaceSchema = stepSchema;

// Steps schema
const stepsSchema = z.array(stepSchema).min(1, 'At least one step is required');

// Workflow schema that combines interface and steps
const workflowSchema = z.object({
  interface: interfaceSchema,
  steps: stepsSchema,
});

export { interfaceSchema, stepsSchema, workflowSchema };

// Helper functions for validation
export function validateInterface(
  interfaceData: unknown,
): z.SafeParseReturnType<unknown, WorkflowStep> {
  try {
    return interfaceSchema.safeParse(interfaceData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error validating interface:', error);
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: `Failed to validate interface: ${errorMessage}`,
          path: [],
        },
      ]),
    };
  }
}

export function validateSteps(steps: unknown): z.SafeParseReturnType<unknown, WorkflowStep[]> {
  try {
    return stepsSchema.safeParse(steps);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error validating steps:', error);
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: `Failed to validate steps: ${errorMessage}`,
          path: [],
        },
      ]),
    };
  }
}

export function validateWorkflow(workflow: unknown): z.SafeParseReturnType<unknown, Workflow> {
  try {
    return workflowSchema.safeParse(workflow);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error validating workflow:', error);
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: `Failed to validate workflow: ${errorMessage}`,
          path: [],
        },
      ]),
    };
  }
}

function zodToOllamaTool(name: string, description: string, schema: z.ZodTypeAny): Tool {
  try {
    const jsonSchema = zodToJsonSchema(schema, name);
    return {
      type: 'function',
      function: {
        name,
        description,
        parameters: {
          type: 'object',
          required: [],
          properties: {},
          ...(jsonSchema.definitions?.[name] || jsonSchema),
        },
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error converting schema to Ollama tool for ${name}:`, error);
    throw new Error(`Failed to convert schema to Ollama tool: ${errorMessage}`);
  }
}

export const interfaceTool: Tool = zodToOllamaTool(
  'generate_interface',
  'Generate an interface for a workflow',
  interfaceSchema,
);

export const stepsTool: Tool = zodToOllamaTool(
  'generate_steps',
  'Generate workflow steps',
  stepsSchema,
);
