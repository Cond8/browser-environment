import { WorkflowValidationError } from '@/features/ollama-api/streaming/api/workflow-chain';
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
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

const VALID_TYPES = ['string', 'number', 'boolean', 'object', 'array', 'any'] as const;
type ValidType = (typeof VALID_TYPES)[number];

// Schema that accepts any JSON value
const anyJson: z.ZodType<any> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.array(anyJson), z.record(anyJson)]),
);

// A very lenient JSON schema that accepts nearly anything
const jsonSchema = z
  .object({
    type: z.union([z.enum(VALID_TYPES), z.array(z.string())]).optional(),
    description: z.string().optional(),
    properties: z.record(anyJson).optional(),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
    items: anyJson.optional(),
    patternProperties: z.record(anyJson).optional(),
    $schema: z.string().optional(),
    optionalProperties: z.boolean().optional(),
    requiredProperties: z.array(z.string()).optional(),
  })
  .catchall(anyJson);

// The main schema is also very lenient
const workflowStepSchema = z.object({
  name: z.string().min(1),
  module: z.string().min(1),
  function: z.string().min(1),
  goal: z.string().min(1),
  params: z.record(jsonSchema).optional(),
  returns: z.record(jsonSchema).optional(),
});

// A very lenient schema for JSON Schema-like objects
const jsonSchemaLike = z
  .object({
    type: z.union([z.string(), z.array(z.string())]).optional(),
    description: z.string().optional(),
    items: z.any().optional(),
    properties: z.record(z.any()).optional(),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
    patternProperties: z.record(z.any()).optional(),
    $schema: z.string().optional(),
    optionalProperties: z.boolean().optional(),
    requiredProperties: z.array(z.string()).optional(),
    pattern: z.string().optional(),
  })
  .passthrough();

// Default values for required fields
const DEFAULT_NAME = 'WorkflowStep';
const DEFAULT_MODULE = 'transform';
const DEFAULT_FUNCTION = 'processData';
const DEFAULT_GOAL = 'Process inputs and produce outputs';

// Very lenient workflow step schema that allows for interface extraction
const lenientWorkflowSchema = z
  .object({
    interface: z
      .object({
        name: z.string().min(1).optional(),
        module: z.string().min(1).optional(),
        function: z.string().min(1).optional(),
        goal: z.string().min(1).optional(),
        params: z.record(jsonSchemaLike).optional(),
        returns: z.record(jsonSchemaLike).optional(),
      })
      .optional(),
    // If no interface property, check for direct properties
    name: z.string().min(1).optional(),
    module: z.string().min(1).optional(),
    function: z.string().min(1).optional(),
    goal: z.string().min(1).optional(),
    params: z.record(jsonSchemaLike).optional(),
    returns: z.record(jsonSchemaLike).optional(),
  })
  .passthrough();

/**
 * Extract the first word from a string that could be in camelCase or snake_case
 */
function extractFirstWord(text: string): string {
  if (!text) return '';

  // Handle camelCase (extract until first capital letter)
  if (/[A-Z]/.test(text)) {
    const firstWordEnd = text.search(/[A-Z]/);
    if (firstWordEnd > 0) {
      return text.substring(0, firstWordEnd);
    }
  }

  // Handle snake_case (extract until first underscore)
  if (text.includes('_')) {
    const firstWordEnd = text.indexOf('_');
    if (firstWordEnd > 0) {
      return text.substring(0, firstWordEnd);
    }
  }

  // Handle comma-separated values (extract until first comma)
  if (text.includes(',')) {
    const firstWordEnd = text.indexOf(',');
    if (firstWordEnd > 0) {
      return text.substring(0, firstWordEnd).trim();
    }
  }

  // If no word separators found, return the whole string
  return text;
}

export function validateWorkflowStep(step: unknown): WorkflowStep {
  try {
    // Use the lenient schema first to check the overall structure
    const lenientParsed = lenientWorkflowSchema.parse(step);

    // Extract the actual workflow data (either from interface or direct properties)
    const rawWorkflowData = lenientParsed.interface || {
      name: lenientParsed.name,
      module: lenientParsed.module,
      function: lenientParsed.function,
      goal: lenientParsed.goal,
      params: lenientParsed.params,
      returns: lenientParsed.returns,
    };

    // Apply defaults for missing values and normalize module name
    const workflowData = {
      name: rawWorkflowData.name || DEFAULT_NAME,
      module: extractFirstWord(rawWorkflowData.module || DEFAULT_MODULE),
      function: rawWorkflowData.function || DEFAULT_FUNCTION,
      goal: rawWorkflowData.goal || DEFAULT_GOAL,
      params: rawWorkflowData.params || {},
      returns: rawWorkflowData.returns || {},
    };

    // Transform params to match WorkflowStep type
    const transformedParams: Record<string, { type: string; description: string }> = {};
    if (Object.keys(workflowData.params).length > 0) {
      Object.entries(workflowData.params).forEach(([key, value]) => {
        transformedParams[key] = {
          type: Array.isArray(value.type) ? value.type[0] : (value.type as string) || 'any',
          description: value.description || `Parameter ${key}`,
        };
      });
    } else {
      // Add a default param if none provided
      transformedParams['input'] = {
        type: 'string',
        description: 'Input data for the workflow',
      };
    }

    // Transform returns to match WorkflowStep type
    const transformedReturns: Record<string, { type: string; description: string }> = {};
    if (Object.keys(workflowData.returns).length > 0) {
      Object.entries(workflowData.returns).forEach(([key, value]) => {
        transformedReturns[key] = {
          type: Array.isArray(value.type) ? value.type[0] : (value.type as string) || 'any',
          description: value.description || `Return value ${key}`,
        };
      });
    } else {
      // Add a default return if none provided
      transformedReturns['output'] = {
        type: 'string',
        description: 'Output data from the workflow',
      };
    }

    return {
      name: workflowData.name,
      module: workflowData.module,
      function: workflowData.function,
      goal: workflowData.goal,
      params: transformedParams,
      returns: transformedReturns,
    };
  } catch (error) {
    console.error('Validation failed with error:', error);
    if (error instanceof z.ZodError) {
      const field = error.errors[0]?.path.join('.');
      throw new WorkflowValidationError(
        error.errors[0]?.message || 'Validation failed',
        'interface',
        [field || ''],
        step,
      );
    }

    // For any other errors, create a valid default workflow step
    return {
      name: DEFAULT_NAME,
      module: DEFAULT_MODULE,
      function: DEFAULT_FUNCTION,
      goal: DEFAULT_GOAL,
      params: { input: { type: 'string', description: 'Input data for the workflow' } },
      returns: { output: { type: 'string', description: 'Output data from the workflow' } },
    };
  }
}
