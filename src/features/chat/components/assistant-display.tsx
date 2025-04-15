// src/features/chat/components/assistant-display.tsx
import { SLMOutput } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdown-components';
import { PartialWorkflowStepDisplay, WorkflowStepDisplay } from './workflow-step-components';

type MessageDisplayProps = {
  content: string | SLMOutput | undefined | null;
};

type StreamingMessageDisplayProps = {
  content: SLMOutput | undefined | null;
  isStreaming: boolean;
};

// Helper function to check if an object is a workflow step
function isWorkflowStep(obj: any): obj is { interface: any; type: string } {
  return obj && typeof obj === 'object' && 'interface' in obj;
}

// Helper to check if it's a complete workflow step with all required fields
function isCompleteWorkflowStep(obj: any): boolean {
  return (
    isWorkflowStep(obj) &&
    obj.interface &&
    typeof obj.interface === 'object' &&
    'name' in obj.interface &&
    'module' in obj.interface &&
    'function' in obj.interface &&
    'goal' in obj.interface &&
    'params' in obj.interface &&
    'returns' in obj.interface
  );
}

export const AssistantDisplay = ({ content }: MessageDisplayProps) => {
  // Handle null/undefined content
  if (!content) {
    return <div className={cn('p-4', 'bg-muted/30')}>No content available</div>;
  }

  // Handle string content
  if (typeof content === 'string') {
    return (
      <div className={cn('p-4', 'bg-muted/30', 'prose prose-sm dark:prose-invert max-w-none')}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Handle SLMOutput
  if (Array.isArray(content)) {
    return (
      <div className={cn('p-4', 'bg-muted/30')}>
        {content.map((chunk, index) => {
          if (!chunk) return null;

          if (chunk.type === 'text') {
            return (
              <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {chunk.content}
                </ReactMarkdown>
              </div>
            );
          } else if (chunk.type === 'json') {
            // Check if the content is a workflow step
            if (isWorkflowStep(chunk.content)) {
              // We only use the complete component in static display - partial ones are ignored
              if (isCompleteWorkflowStep(chunk.content)) {
                return (
                  <div key={index} className="mt-2">
                    <WorkflowStepDisplay step={chunk.content} />
                  </div>
                );
              }
              // Skip incomplete workflow steps in static display
              return null;
            }
            // Format JSON content
            const formattedJson =
              typeof chunk.content === 'string'
                ? chunk.content
                : '```json\n' + JSON.stringify(chunk.content, null, 2) + '\n```';

            return (
              <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {formattedJson}
                </ReactMarkdown>
              </div>
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

export const StreamingAssistantDisplay = ({
  content,
  isStreaming,
}: StreamingMessageDisplayProps) => {
  // Handle null/undefined content
  if (!content) {
    return <div className={cn('p-4', 'bg-muted/30')}>No content available</div>;
  }

  return (
    <div className={cn('p-4', 'bg-muted/30')}>
      {content.map((chunk, index) => {
        if (!chunk) return null;

        if (chunk.type === 'text') {
          return (
            <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {chunk.content}
              </ReactMarkdown>
              {isStreaming && index === content.length - 1 && (
                <span className="animate-pulse">▋</span>
              )}
            </div>
          );
        } else if (chunk.type === 'json') {
          // Check if the content is a workflow step
          if (isWorkflowStep(chunk.content)) {
            return (
              <div key={index} className="mt-2">
                <PartialWorkflowStepDisplay step={chunk.content} />
              </div>
            );
          }

          // Format JSON content
          const formattedJson =
            typeof chunk.content === 'string'
              ? chunk.content
              : '```json\n' + JSON.stringify(chunk.content, null, 2) + '\n```';

          return (
            <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {formattedJson}
              </ReactMarkdown>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};
