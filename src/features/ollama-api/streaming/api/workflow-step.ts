// src/features/ollama-api/streaming/api/workflow-step.ts
export interface WorkflowStep {
  name: string;
  module: string;
  functionName: string;
  goal: string;
  params: Record<string, { type: string; description: string }>;
  returns: Record<string, { type: string; description: string }>;
}

export type WorkflowStepInput = Omit<WorkflowStep, 'params' | 'returns'> & {
  params:
    | Record<string, { type: string; description: string }>
    | {
        type: string;
        properties: Record<string, { type: string; description: string }>;
        required?: string[];
      };
  returns:
    | Record<string, { type: string; description: string }>
    | {
        type: string;
        properties: Record<string, { type: string; description: string }>;
        required?: string[];
      };
};
