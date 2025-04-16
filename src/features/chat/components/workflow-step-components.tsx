// src/features/chat/components/workflow-step-components.tsx
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Code, FileText, FunctionSquare, Goal } from 'lucide-react';
import { useState } from 'react';
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
  name?: string;
  module?: string;
  function?: string;
  goal?: string;
  params?: Record<string, PropertyDefinition>;
  returns?: Record<string, PropertyDefinition>;
}

interface WorkflowStepDisplayProps {
  step: WorkflowInterface;
  className?: string;
}

export const WorkflowStepDisplay = ({ step, className }: WorkflowStepDisplayProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasDetails =
    Object.keys(step).length > 2 || !!(step.module || step.function || step.params || step.returns);

  return (
    <div className={cn('p-4 space-y-4 bg-card rounded-lg border', className)}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-primary shrink-0" />
          <h3 className="text-lg font-semibold truncate">
            {step.name ? toSpaceCase(step.name) : 'Loading...'}
          </h3>
        </div>
        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {expanded ? (
              <>
                <ChevronDown className="h-3 w-3" />
                Less
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3" />
                More...
              </>
            )}
          </button>
        )}
      </div>

      {/* Goal Section - Always visible */}
      {step.goal && (
        <div className="flex items-start gap-2">
          <Goal className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">{step.goal}</p>
        </div>
      )}

      {/* Collapsible content */}
      {expanded && (
        <>
          {/* Module and Function Section */}
          {(step.module || step.function) && (
            <div className="grid grid-cols-2 gap-4">
              {step.module && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{toSpaceCase(step.module)}</span>
                </div>
              )}
              {step.function && (
                <div className="flex items-center gap-2">
                  <FunctionSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{toSpaceCase(step.function)}</span>
                </div>
              )}
            </div>
          )}

          {/* Parameters and Returns Sections */}
          {step.params && <JsonSchemaRenderer schema={step.params} title="Parameters" />}
          {step.returns && <JsonSchemaRenderer schema={step.returns} title="Returns" />}
        </>
      )}
    </div>
  );
};

// For backward compatibility - aliasing PartialWorkflowStepDisplay to WorkflowStepDisplay
export const PartialWorkflowStepDisplay = WorkflowStepDisplay;
