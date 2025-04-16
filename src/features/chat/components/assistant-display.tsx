// src/features/chat/components/assistant-display.tsx
import { SLMChunk, SLMOutput } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { validateWorkflowStep } from '@/features/editor/transpilers-json-source/workflow-step-validator';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BaseThreadMessage } from '../models/assistant-message';
import { isBaseThreadMessage, isSLMOutputInstance } from '../models/thread-message-utils';
import { markdownComponents } from './markdown-components';
import { WorkflowStepDisplay } from './workflow-step-components';

type MessageDisplayProps = {
  content: string | SLMOutput | BaseThreadMessage | undefined | null;
};

type StreamingMessageDisplayProps = {
  content: SLMOutput | undefined | null;
  isStreaming: boolean;
};

export const AssistantDisplay = ({ content }: MessageDisplayProps) => {
  const [displayContent, setDisplayContent] = useState<string | SLMOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle async content loading for BaseThreadMessage
  useEffect(() => {
    const loadContent = async () => {
      if (!content) {
        setDisplayContent(null);
        return;
      }

      if (isBaseThreadMessage(content)) {
        try {
          setLoading(true);
          const resolvedContent = await content.getContent();
          setDisplayContent(resolvedContent);
        } catch (err) {
          setError(err as Error);
          setDisplayContent(content.getRawContent());
        } finally {
          setLoading(false);
        }
      } else {
        // For direct content (string or SLMOutput), just set it directly
        setDisplayContent(content);
      }
    };

    loadContent();
  }, [content]);

  // Handle null/undefined content
  if (!displayContent && !loading) {
    return <div className={cn('p-4', 'bg-muted/30')}>No content available</div>;
  }

  // Display loading state
  if (loading) {
    return <div className={cn('p-4', 'bg-muted/30')}>Loading message content...</div>;
  }

  // Handle error state
  if (error) {
    return (
      <div className={cn('p-4', 'bg-muted/30', 'text-destructive')}>
        Error loading content: {error.message}
      </div>
    );
  }

  // Handle string content
  if (typeof displayContent === 'string') {
    return (
      <div className={cn('p-4', 'bg-muted/30', 'prose prose-sm dark:prose-invert max-w-none')}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {displayContent}
        </ReactMarkdown>
      </div>
    );
  }

  // Handle SLMOutput content
  if (isSLMOutputInstance(displayContent)) {
    return <StreamingAssistantDisplay content={displayContent} isStreaming={false} />;
  }

  return null;
};

export const StreamingAssistantDisplay = ({
  content,
  isStreaming,
}: StreamingMessageDisplayProps) => {
  // Handle null/undefined content
  if (!content) {
    return <div className={cn('p-4', 'bg-muted/30')}>No content available</div>;
  }

  const chunks = content.Chunks;

  return (
    <div className={cn('p-4', 'bg-muted/30')}>
      {chunks.map((chunk: SLMChunk, index: number) => {
        if (!chunk) return null;

        if (chunk.type === 'text') {
          return (
            <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {chunk.content}
              </ReactMarkdown>
              {isStreaming && index === chunks.length - 1 && (
                <span className="animate-pulse">▋</span>
              )}
            </div>
          );
        } else if (chunk.type === 'json') {
          // Check if the content is a workflow step
          if (isBaseThreadMessage(chunk.content)) {
            // Validate the workflow step
            const validatedStep = validateWorkflowStep(chunk.content);
            return (
              <div key={index} className="mt-2">
                <WorkflowStepDisplay step={validatedStep} />
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
