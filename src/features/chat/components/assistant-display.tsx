// src/features/chat/components/assistant-display.tsx
import { AssistantChunk, WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { cn } from '@/lib/utils';
import { extractJsonChunks } from '@/utils/extract-json-chunks';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AssistantMessage } from '../models/assistant-message';
import { markdownComponents } from './markdown-components';
import { WorkflowStepDisplay } from './workflow-step-components';

interface AssistantDisplayProps {
  assistantMessage: AssistantMessage;
}

const MarkdownRenderer = memo(({ content }: { content: string }) => (
  <div className={cn('prose max-w-none p-4')}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  </div>
));

export const AssistantDisplay = ({ assistantMessage }: AssistantDisplayProps) => {
  const chunks = useMemo<AssistantChunk[]>(
    () => extractJsonChunks(assistantMessage.content ?? ''),
    [assistantMessage.content],
  );

  console.log({ chunks });

  let interfaceShown = true;

  return (
    <div>
      {chunks.map((chunk, i) => {
        if (chunk.type === 'text') {
          return <MarkdownRenderer key={i} content={chunk.content} />;
        } else {
          try {
            const step = JSON.parse(chunk.content) as WorkflowStep;
            const view = <WorkflowStepDisplay key={i} step={step} isInterface={interfaceShown} />;
            interfaceShown = false;
            return view;
          } catch (error) {
            console.error('Failed to parse JSON chunk:', error);
            return <MarkdownRenderer key={i} content={chunk.content} />;
          }
        }
      })}
    </div>
  );
};
