// src/features/chat/components/assistant-display.tsx
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { cn } from '@/lib/utils';
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
  <div className={cn('prose dark:prose-invert max-w-none p-4')}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  </div>
));

export const AssistantDisplay = ({ assistantMessage }: AssistantDisplayProps) => {
  const { content } = assistantMessage;

  console.log('content', assistantMessage);

  if (!content) {
    return null;
  }

  const jsonChunks = useMemo(() => {
    const chunks: (string | any)[] = [];
    content.split('```json').forEach(chunk => {
      if (chunk.includes('```')) {
        const [json, text] = chunk.split('```');
        try {
          chunks.push(processJsonChunk(json));
        } catch (e) {
          console.error('error', e);
          chunks.push(json);
        }
        chunks.push(text);
      } else {
        chunks.push(chunk);
      }
    });
    return chunks;
  }, [content]);

  let interfaceShown = true;

  return (
    <div>
      {jsonChunks.map((chunk, index) => {
        if (typeof chunk === 'string') {
          return <MarkdownRenderer key={index} content={chunk} />;
        }
        const In = <WorkflowStepDisplay key={index} step={chunk} isInterface={interfaceShown} />;
        if (interfaceShown) {
          interfaceShown = false;
        }
        return In;
      })}
    </div>
  );
};
