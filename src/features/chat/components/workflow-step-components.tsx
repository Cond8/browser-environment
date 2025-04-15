// src/features/chat/components/workflow-step-components.tsx
import { cn } from '@/lib/utils';
import { Code, FileText, FunctionSquare, Goal } from 'lucide-react';
import { JsonSchemaRenderer } from './json-schema-renderer';

// Utility function to convert PascalCase/camelCase to Space Case
const toSpaceCase = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove any leading/trailing spaces
};

interface PropertyDefinition {
  type: string;
  description: string;
  properties?: Record<string, PropertyDefinition>;
}

interface WorkflowInterface {
  name: string;
  module: string;
  function: string;
  goal: string;
  params: Record<string, PropertyDefinition>;
  returns: Record<string, PropertyDefinition>;
}

interface PartialWorkflowInterface {
  name?: string;
  module?: string;
  function?: string;
  goal?: string;
  params?: Record<string, PropertyDefinition>;
  returns?: Record<string, PropertyDefinition>;
}

interface WorkflowStepDisplayProps {
  step: { interface: WorkflowInterface; type: string };
  className?: string;
}

interface PartialWorkflowStepDisplayProps {
  step: { interface?: PartialWorkflowInterface; type?: string };
  className?: string;
}

export const WorkflowStepDisplay = ({ step, className }: WorkflowStepDisplayProps) => {
  const { interface: workflow } = step;

  return (
    <div className={cn('p-4 space-y-4 bg-card rounded-lg border', className)}>
      {/* Header Section */}
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5 text-primary shrink-0" />
        <h3 className="text-lg font-semibold truncate">{toSpaceCase(workflow.name)}</h3>
      </div>

      {/* Goal Section */}
      <div className="flex items-start gap-2">
        <Goal className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">{workflow.goal}</p>
      </div>

      {/* Module and Function Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{toSpaceCase(workflow.module)}</span>
        </div>
        <div className="flex items-center gap-2">
          <FunctionSquare className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{toSpaceCase(workflow.function)}</span>
        </div>
      </div>

      {/* Parameters and Returns Sections */}
      <JsonSchemaRenderer schema={workflow.params} title="Parameters" />
      <JsonSchemaRenderer schema={workflow.returns} title="Returns" />
    </div>
  );
};

export const PartialWorkflowStepDisplay = ({
  step,
  className,
}: PartialWorkflowStepDisplayProps) => {
  const workflow = step.interface || {};

  return (
    <div className={cn('p-4 space-y-4 bg-card rounded-lg border', className)}>
      {/* Header Section */}
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5 text-primary shrink-0" />
        <h3 className="text-lg font-semibold truncate">
          {workflow.name ? toSpaceCase(workflow.name) : 'Loading...'}
        </h3>
      </div>

      {/* Goal Section */}
      {workflow.goal && (
        <div className="flex items-start gap-2">
          <Goal className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">{workflow.goal}</p>
        </div>
      )}

      {/* Module and Function Section */}
      {(workflow.module || workflow.function) && (
        <div className="grid grid-cols-2 gap-4">
          {workflow.module && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">{toSpaceCase(workflow.module)}</span>
            </div>
          )}
          {workflow.function && (
            <div className="flex items-center gap-2">
              <FunctionSquare className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">{toSpaceCase(workflow.function)}</span>
            </div>
          )}
        </div>
      )}

      {/* Parameters and Returns Sections */}
      {workflow.params && <JsonSchemaRenderer schema={workflow.params} title="Parameters" />}
      {workflow.returns && <JsonSchemaRenderer schema={workflow.returns} title="Returns" />}
    </div>
  );
};
