// src/features/chat/components/assistant-display.tsx
import { SLMOutput } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { cn } from '@/lib/utils';
import { WorkflowStepDisplay } from './workflow-step-components';

type MessageDisplayProps = {
  content: string | SLMOutput | undefined | null;
  type: 'alignment' | 'interface' | 'step';
};

// Helper function to check if an object is a workflow step
function isWorkflowStep(obj: any): obj is WorkflowStep {
  return obj && typeof obj === 'object' && 'name' in obj && 'module' in obj && 'function' in obj;
}

// Helper function to check if an object is a workflow interface step
function isWorkflowInterfaceStep(obj: any): obj is { interface: any; type: string } {
  return obj && typeof obj === 'object' && 'interface' in obj && 'type' in obj;
}

export const AssistantDisplay = ({ content, type }: MessageDisplayProps) => {
  // Handle null/undefined content
  if (!content) {
    return <div className={cn('p-4', 'bg-muted/30')}>No content available</div>;
  }

  // Handle string content
  if (typeof content === 'string') {
    return <div className={cn('p-4', 'bg-muted/30')}>{content}</div>;
  }

  // Handle SLMOutput
  if (Array.isArray(content)) {
    return (
      <div className={cn('p-4', 'bg-muted/30')}>
        {content.map((chunk, index) => {
          if (!chunk) return null;

          if (chunk.type === 'text') {
            return <div key={index}>{chunk.content}</div>;
          } else if (chunk.type === 'json') {
            // Check if the content is a workflow step
            if (isWorkflowStep(chunk.content)) {
              return (
                <div key={index} className="mt-2">
                  <pre className="p-2 bg-muted rounded">
                    {JSON.stringify(chunk.content, null, 2)}
                  </pre>
                </div>
              );
            }
            // Check if the content is a workflow interface step
            if (isWorkflowInterfaceStep(chunk.content)) {
              return (
                <div key={index} className="mt-2">
                  <WorkflowStepDisplay step={chunk.content} />
                </div>
              );
            }
            // Fallback to JSON display for other JSON content
            return (
              <pre key={index} className="mt-2 p-2 bg-muted rounded">
                {JSON.stringify(chunk.content, null, 2)}
              </pre>
            );
          }
          return null;
        })}
      </div>
    );
  }

  // Fallback for unexpected content type
  return <div className={cn('p-4', 'bg-muted/30')}>Invalid content type: {typeof content}</div>;
};
