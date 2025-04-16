// src/features/ollama-api/streaming/api/workflow-step.ts
export interface WorkflowStep {
  name: string;
  module: string;
  functionName: string;
  goal: string;
  params: Record<string, { type: string; description: string }>;
  returns: Record<string, { type: string; description: string }>;
}
