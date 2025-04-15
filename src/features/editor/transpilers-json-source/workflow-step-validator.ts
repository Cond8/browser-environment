import { WorkflowValidationError } from '@/features/ollama-api/streaming/api/workflow-chain';
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';

export class WorkflowStepValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'WorkflowStepValidationError';
  }
}

const VALID_MODULES = [
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

const VALID_TYPES = ['string', 'number', 'boolean', 'object', 'array', 'any'];

export function validateWorkflowStep(step: unknown): WorkflowStep {
  if (!step || typeof step !== 'object') {
    throw new WorkflowStepValidationError('Input must be an object');
  }

  const workflowStep = step as WorkflowStep;

  // Validate name
  if (!workflowStep.name || typeof workflowStep.name !== 'string') {
    throw new WorkflowStepValidationError('Name is required and must be a string', 'name');
  }

  // Validate module
  if (!workflowStep.module || typeof workflowStep.module !== 'string') {
    throw new WorkflowStepValidationError('Module is required and must be a string', 'module');
  }
  if (!VALID_MODULES.includes(workflowStep.module)) {
    throw new WorkflowStepValidationError(
      `Module must be one of: ${VALID_MODULES.join(', ')}`,
      'module',
    );
  }

  // Validate function
  if (!workflowStep.function || typeof workflowStep.function !== 'string') {
    throw new WorkflowStepValidationError('Function is required and must be a string', 'function');
  }
  if (!/^[a-z][a-z0-9_]*$/.test(workflowStep.function)) {
    throw new WorkflowStepValidationError(
      'Function must be in snake_case and start with a letter',
      'function',
    );
  }

  // Validate goal
  if (!workflowStep.goal || typeof workflowStep.goal !== 'string') {
    throw new WorkflowStepValidationError('Goal is required and must be a string', 'goal');
  }

  // Validate params
  if (!workflowStep.params || typeof workflowStep.params !== 'object') {
    throw new WorkflowStepValidationError('Params must be an object', 'params');
  }
  validateParamStructure(workflowStep.params, 'params');

  // Validate returns
  if (!workflowStep.returns || typeof workflowStep.returns !== 'object') {
    throw new WorkflowStepValidationError('Returns must be an object', 'returns');
  }
  validateParamStructure(workflowStep.returns, 'returns');

  return workflowStep;
}

function validateParamStructure(
  params: Record<string, { type: string; description: string }>,
  field: 'params' | 'returns',
): void {
  for (const [key, value] of Object.entries(params)) {
    if (!value || typeof value !== 'object') {
      throw new WorkflowStepValidationError(
        `Each ${field} entry must be an object`,
        `${field}.${key}`,
      );
    }

    if (!value.type || typeof value.type !== 'string') {
      throw new WorkflowValidationError(
        `Type is required and must be a string for ${field}.${key}`,
        'interface',
        [`${field}.${key}.type`],
        value,
      );
    }

    if (!VALID_TYPES.includes(value.type)) {
      throw new WorkflowValidationError(
        `Type must be one of: ${VALID_TYPES.join(', ')} for ${field}.${key}`,
        'interface',
        [`${field}.${key}.type`],
        value,
      );
    }

    if (!value.description || typeof value.description !== 'string') {
      throw new WorkflowValidationError(
        `Description is required and must be a string for ${field}.${key}`,
        'interface',
        [`${field}.${key}.description`],
        value,
      );
    }
  }
}
