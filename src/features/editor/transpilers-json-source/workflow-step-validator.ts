// src/features/editor/transpilers-json-source/workflow-step-validator.ts
import { WorkflowStep } from '@/features/chat/models/assistant-message';
import { z } from 'zod';
export class WorkflowStepValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'WorkflowStepValidationError';
  }
}

// Default values for required fields
const DEFAULT_NAME = 'WorkflowStep';
const DEFAULT_MODULE = 'transform';
const DEFAULT_FUNCTION = 'processData';
const DEFAULT_GOAL = 'Process inputs and produce outputs';

// Schema for workflow step properties
const propertySchema = z.object({
  type: z.string().default('string'),
  description: z.string().default('Parameter description'),
});

const propertiesSchema = z.record(propertySchema);

const paramsSchema = z
  .union([
    propertiesSchema,
    z.object({
      type: z.string().default('object'),
      properties: propertiesSchema,
      required: z.array(z.string()).optional(),
    }),
  ])
  .transform(val => {
    if (val && typeof val === 'object' && 'properties' in val) {
      return val.properties;
    }
    return val as Record<string, { type: string; description: string }>;
  });

const returnsSchema = z
  .union([
    propertiesSchema,
    z.object({
      type: z.string().default('object'),
      properties: propertiesSchema,
      required: z.array(z.string()).optional(),
    }),
  ])
  .transform(val => {
    if (val && typeof val === 'object' && 'properties' in val) {
      return val.properties;
    }
    return val as Record<string, { type: string; description: string }>;
  });

const workflowStepSchema = z.object({
  name: z.string().min(1).default(DEFAULT_NAME),
  module: z.string().min(1).default(DEFAULT_MODULE),
  functionName: z.string().min(1).default(DEFAULT_FUNCTION),
  goal: z.string().min(1).default(DEFAULT_GOAL),
  params: paramsSchema.default({}),
  returns: returnsSchema.default({}),
});

/**
 * Extract the module name from a possibly longer string
 */
function normalizeModuleName(moduleName: string): string {
  if (!moduleName) return DEFAULT_MODULE;

  // Handle common module patterns
  const modules = [
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
  ];

  // Return the module name if it's already valid
  if (modules.includes(moduleName)) return moduleName;

  // Try to extract a valid module name
  for (const mod of modules) {
    if (moduleName.includes(mod)) return mod;
  }

  // Default to transform if no match found
  return DEFAULT_MODULE;
}

export function validateWorkflowStep(step: unknown): WorkflowStep {
  try {
    // Check if step has interface property
    const withInterface = step as { interface?: Record<string, any> };
    const dataToValidate = withInterface.interface || step;

    // Apply schema validation with defaults
    const validated = workflowStepSchema.parse(dataToValidate);

    // Normalize module name
    validated.module = normalizeModuleName(validated.module);

    // Transform params and returns if needed
    const transformed = {
      name: validated.name,
      module: validated.module,
      functionName: validated.functionName,
      goal: validated.goal,
      params:
        'properties' in validated.params ? (validated.params.properties as any) : validated.params,
      returns:
        'properties' in validated.returns
          ? (validated.returns.properties as any)
          : validated.returns,
    } as WorkflowStep;

    // Ensure params and returns have at least one entry
    if (Object.keys(transformed.params).length === 0) {
      transformed.params = {
        input: { type: 'string', description: 'Input data for the workflow' },
      };
    }

    if (Object.keys(transformed.returns).length === 0) {
      transformed.returns = {
        output: { type: 'string', description: 'Output data from the workflow' },
      };
    }

    return transformed;
  } catch (error) {
    console.error('Validation failed:', error);

    // Create a default valid workflow step
    return {
      name: DEFAULT_NAME,
      module: DEFAULT_MODULE,
      functionName: DEFAULT_FUNCTION,
      goal: DEFAULT_GOAL,
      params: { input: { type: 'string', description: 'Input data for the workflow' } },
      returns: { output: { type: 'string', description: 'Output data from the workflow' } },
    };
  }
}
