import { cn } from '@/lib/utils';
import { Code, FileText, FunctionSquare, Goal, ListChecks, Type } from 'lucide-react';

interface WorkflowInterface {
  name: string;
  service: string;
  method: string;
  goal: string;
  params: Record<string, { type: string; description: string }>;
  returns: Record<string, { type: string; description: string }>;
}

interface WorkflowStepDisplayProps {
  step: { interface: WorkflowInterface; type: string };
  className?: string;
}

export const WorkflowStepDisplay = ({ step, className }: WorkflowStepDisplayProps) => {
  const { interface: workflow } = step;

  return (
    <div className={cn('p-4 space-y-4 bg-card rounded-lg border', className)}>
      {/* Header Section */}
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{workflow.name}</h3>
      </div>

      {/* Goal Section */}
      <div className="flex items-start gap-2">
        <Goal className="h-5 w-5 text-muted-foreground mt-0.5" />
        <p className="text-sm text-muted-foreground">{workflow.goal}</p>
      </div>

      {/* Service and Method Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{workflow.service}</span>
        </div>
        <div className="flex items-center gap-2">
          <FunctionSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{workflow.method}</span>
        </div>
      </div>

      {/* Parameters Section */}
      {Object.entries(workflow.params).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Parameters</h4>
          </div>
          <div className="grid gap-2 pl-6">
            {Object.entries(workflow.params).map(([name, { type, description }]) => (
              <div key={name} className="flex items-start gap-2">
                <Type className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">({type})</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returns Section */}
      {Object.entries(workflow.returns).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Returns</h4>
          </div>
          <div className="grid gap-2 pl-6">
            {Object.entries(workflow.returns).map(([name, { type, description }]) => (
              <div key={name} className="flex items-start gap-2">
                <Type className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">({type})</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
