// src/utils/workflow-helpers.ts
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';

/**
 * Interface for parsed SLM content structure
 */
export interface ParsedSlm {
  markdown: {
    goal?: string;
    inputs?: string;
    outputs?: string;
    plan?: string[];
  };
  steps: WorkflowStep[];
}

/**
 * Creates a default workflow step with standardized structure
 * @param name The name of the workflow step
 * @param functionName The function name of the workflow step
 * @param goal The goal description of the workflow step
 * @param module The module name (defaults to 'transform')
 * @returns A WorkflowStep object with standard structure
 */
export function createDefaultWorkflowStep(
  name: string,
  functionName: string,
  goal: string,
  module = 'transform',
): WorkflowStep {
  return {
    name,
    module,
    functionName,
    goal,
    params: {
      input: { type: 'string', description: 'Input data to process' },
    },
    returns: {
      output: { type: 'string', description: 'Processed output data' },
    },
  };
}

/**
 * Constant for empty parsed SLM result
 */
export const EMPTY_PARSED_SLM: ParsedSlm = {
  markdown: {
    goal: undefined,
    inputs: undefined,
    outputs: undefined,
    plan: undefined,
  },
  steps: [],
};
