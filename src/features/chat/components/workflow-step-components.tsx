// src/features/chat/components/workflow-step-components.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { cn } from '@/lib/utils';
import {
  Brackets,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Code,
  FileText,
  FunctionSquare,
} from 'lucide-react';
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

interface WorkflowStepDisplayProps {
  step: WorkflowStep;
  className?: string;
  isInterface?: boolean;
  isStreaming?: boolean;
}

export const WorkflowStepDisplay = ({
  step,
  className,
  isInterface,
  isStreaming = false,
}: WorkflowStepDisplayProps) => {
  const [expanded, setExpanded] = useState(isStreaming);
  const hasDetails =
    Object.keys(step).length > 2 ||
    !!(
      step.module ||
      step.functionName ||
      step.params ||
      step.returns ||
      (step as unknown as { rawContent: string }).rawContent
    );

  // Check if we have raw content (for displaying raw JSON)

  return (
    <div
      className={cn(
        'group relative pl-3 pr-2 py-2 rounded-lg transition-all duration-200',
        'hover:bg-accent/50',
        isInterface ? 'border-l-2 border-l-primary' : 'border-l-2 border-l-transparent',
        className,
      )}
    >
      {/* Main content */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            {isInterface ? (
              <Brackets className="h-4 w-4 text-primary shrink-0" />
            ) : (step as unknown as { rawContent: string }).rawContent ? ( // backwards compatibility
              <Code className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <CircleDot className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <h3 className="text-sm font-semibold truncate text-foreground/90">
              {step.name ? toSpaceCase(step.name) : 'Loading...'}
            </h3>
          </div>

          {/* Goal Section - Always visible */}
          {step.goal && (
            <div className="flex items-start gap-2 ml-6">
              <p className="text-xs text-muted-foreground/90 leading-relaxed">{step.goal}</p>
            </div>
          )}
        </div>

        {/* Expand/Collapse button */}
        {hasDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'h-6 px-2 text-xs shrink-0',
              'text-muted-foreground hover:text-foreground',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              expanded && 'opacity-100',
            )}
          >
            {expanded ? (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3 mr-1" />
                Details
              </>
            )}
          </Button>
        )}
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="mt-3 ml-6 space-y-3">
          {/* Raw Content Section - For displaying raw JSON */}
          {(step as unknown as { rawContent: string }).rawContent && ( // backwards compatibility
            <div className="bg-muted rounded-md p-3 overflow-auto max-h-[300px]">
              <pre className="text-xs whitespace-pre-wrap">
                {
                  (step as unknown as { rawContent: string })
                    .rawContent /* backwards compatibility */
                }
              </pre>
            </div>
          )}

          {/* Module and Function Section */}
          {(step.module || step.functionName) && (
            <div className="flex flex-wrap gap-2">
              {step.module && (
                <Badge
                  variant="secondary"
                  className="h-5 px-2 flex items-center gap-1.5 bg-secondary/50 hover:bg-secondary/70"
                >
                  <FileText className="h-3 w-3 text-foreground/70" />
                  <span className="text-xs">{toSpaceCase(step.module)}</span>
                </Badge>
              )}
              {step.functionName && (
                <Badge
                  variant="secondary"
                  className="h-5 px-2 flex items-center gap-1.5 bg-secondary/50 hover:bg-secondary/70"
                >
                  <FunctionSquare className="h-3 w-3 text-foreground/70" />
                  <span className="text-xs">{toSpaceCase(step.functionName)}</span>
                </Badge>
              )}
            </div>
          )}

          {/* Parameters and Returns Sections */}
          {!(step as unknown as { rawContent: string }).rawContent && ( // backwards compatibility
            <div className="space-y-2 pt-1">
              {step.params && <JsonSchemaRenderer schema={step.params} title="Parameters" />}
              {step.returns && <JsonSchemaRenderer schema={step.returns} title="Returns" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
