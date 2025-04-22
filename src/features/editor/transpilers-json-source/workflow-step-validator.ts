// src/features/editor/transpilers-json-source/workflow-step-validator.ts
import { useRetryEventBusStore } from '@/features/ollama-api/stores/retry-event-bus-store';
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { z } from 'zod';

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

export const paramsSchema = z
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

export const returnsSchema = z
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

export const workflowStepSchema = z.object({
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
    // Enrich step synonyms
    'extract',
    'fetch',
    'lookup',
    'retrieve',
    'synthesize',
    'expand',
    'integrate',
    // Analyze step synonyms
    'compute',
    'summarize',
    'transform',
    'calculate',
    'measure',
    'score',
    'interpret',
    'derive',
    // Decide step synonyms
    'select',
    'filter',
    'branch',
    'classify',
    'choose',
    'match',
    'group',
    'route',
    'pick',
    // Format step synonyms
    'stringify',
    'render',
    'compile',
    'prepare',
    // Other common modules
    'parse',
    'validate',
    'io',
    'storage',
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

export function validateWorkflowStep(step: WorkflowStep): WorkflowStep {
  try {
    // Check if step has interface property
    const dataToValidate = step;

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
      params: validated.params,
      returns: validated.returns,
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
    console.log('Triggering retry for workflow step validation error', (error as Error).message);
    useRetryEventBusStore.getState().triggerRetry('interface');

    throw new Error('Failed to validate workflow step, triggering retry');
  }
}
