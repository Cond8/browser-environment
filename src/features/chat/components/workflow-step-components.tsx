// src/features/chat/components/workflow-step-components.tsx
import { cn } from '@/lib/utils';
import { Code, FileText, FunctionSquare, Goal, ListChecks, Type } from 'lucide-react';

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

interface WorkflowStepDisplayProps {
  step: { interface: WorkflowInterface; type: string };
  className?: string;
}

const PropertyDisplay = ({
  name,
  property,
  level = 0,
}: {
  name: string;
  property: PropertyDefinition;
  level?: number;
}) => {
  const hasNestedProperties = property.properties && Object.keys(property.properties).length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Type className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{toSpaceCase(name)}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              ({toSpaceCase(property.type)})
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{property.description}</p>
        </div>
      </div>
      {hasNestedProperties && (
        <div className="pl-6 space-y-2">
          {Object.entries(property.properties!).map(([nestedName, nestedProperty]) => (
            <PropertyDisplay
              key={nestedName}
              name={nestedName}
              property={nestedProperty}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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

      {/* Parameters Section */}
      {workflow.params && Object.entries(workflow.params).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted-foreground shrink-0" />
            <h4 className="text-sm font-medium">Parameters</h4>
          </div>
          <div className="grid gap-2 pl-6">
            {Object.entries(workflow.params).map(([name, property]) => (
              <PropertyDisplay key={name} name={name} property={property} />
            ))}
          </div>
        </div>
      )}

      {/* Returns Section */}
      {workflow.returns && Object.entries(workflow.returns).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted-foreground shrink-0" />
            <h4 className="text-sm font-medium">Returns</h4>
          </div>
          <div className="grid gap-2 pl-6">
            {Object.entries(workflow.returns).map(([name, property]) => (
              <PropertyDisplay key={name} name={name} property={property} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
