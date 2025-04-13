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
  inputs?: string[];
  outputs?: string[];
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

// Enhanced interface schema
export const interfaceSchema = z.object({
  name: nameSchema,
  service: z
    .string()
    .min(1)
    .describe(
      'Primary domain service action (e.g., extract, parse, understand). Use single words if possible.',
    ),
  method: methodSchema,
  goal: goalSchema,
  inputs: z.array(variableNameSchema).optional(),
  outputs: z.array(variableNameSchema).optional(),
});

// Enhanced steps schema
export const stepsSchema = z.array(interfaceSchema).min(1, 'At least one step is required');

function zodToOllamaTool(name: string, description: string, schema: z.ZodTypeAny): Tool {
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
}

export const interfaceTool: Tool = zodToOllamaTool(
  'generate_interface',
  'Generate an interface for a workflow',
  interfaceSchema,
);

export const stepsTool: Tool = zodToOllamaTool(
  'generate_step',
  'Generate a single workflow step',
  stepsSchema,
);

console.log(interfaceTool);
