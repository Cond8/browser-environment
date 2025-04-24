// Canonical WorkflowStep type
type WorkflowStep = {
  name: string;
  description: string;
  module: string;
  functionName: string;
  params: Record<string, { type: string; description: string }>;
  returns: Record<string, { type: string; description: string }>;
};

export type { WorkflowStep };
