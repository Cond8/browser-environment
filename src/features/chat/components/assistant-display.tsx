// src/features/chat/components/assistant-display.tsx
import { SLMOutput } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdown-components';
import { WorkflowStepDisplay } from './workflow-step-components';

type MessageDisplayProps = {
  content: string | SLMOutput | undefined | null;
};

// Helper function to check if an object is a workflow step
function isWorkflowStep(obj: any): obj is { interface: any; type: string } {
  return obj && typeof obj === 'object' && 'interface' in obj;
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
              return (
                <div key={index} className="mt-2">
                  <WorkflowStepDisplay step={chunk.content} />
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
  }

  // Fallback for unexpected content type
  return <div className={cn('p-4', 'bg-muted/30')}>Invalid content type: {typeof content}</div>;
};
