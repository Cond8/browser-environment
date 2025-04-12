import { Tool } from 'ollama';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const CLASSES = [
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

export type WorkflowClass = (typeof CLASSES)[number];

export type Workflow = {
  interface: WorkflowStep;
  steps: WorkflowStep[];
};

export type WorkflowStep = {
  name: string;
  class: WorkflowClass;
  method: string;
  goal: string;
  inputs?: string[];
  outputs?: string[];
};

export const interfaceSchema = z.object({
  name: z.string().describe('Name of the workflow in PascalCase (e.g. ProcessUserData)'),
  class: z.enum(CLASSES).describe('Domain class (choose from DOMAIN_CLASSES list)'),
  method: z.string().describe('Method name in snake_case (e.g. transform_user_data)'),
  goal: z.string().describe('Short, clear task summary (max 10 words)'),
  inputs: z.array(z.string().describe('Input variable name in snake_case')).optional(),
  outputs: z.array(z.string().describe('Output variable name in snake_case')).optional(),
});

export const stepsSchema = z.object({
  steps: z.array(interfaceSchema),
});

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
