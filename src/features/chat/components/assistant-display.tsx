// src/features/chat/components/assistant-display.tsx
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { cn } from '@/lib/utils';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AssistantMessage, WorkflowStep } from '../models/assistant-message';
import { markdownComponents } from './markdown-components';
import { WorkflowStepDisplay } from './workflow-step-components';

interface AssistantDisplayProps {
  assistantMessage: AssistantMessage;
}

type Chunk = string | WorkflowStep;

const MarkdownRenderer = memo(({ content }: { content: string }) => (
  <div className={cn('prose dark:prose-invert max-w-none p-4')}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  </div>
));

export const AssistantDisplay = ({ assistantMessage }: AssistantDisplayProps) => {
  const chunks = useMemo<Chunk[]>(
    () => extractJsonChunks(assistantMessage.content ?? ''),
    [assistantMessage.content],
  );

  console.log({ chunks });

  let interfaceShown = true;

  return (
    <div>
      {chunks.map((chunk, i) => {
        if (typeof chunk === 'string') {
          return <MarkdownRenderer key={i} content={chunk} />;
        }
        const view = <WorkflowStepDisplay key={i} step={chunk} isInterface={interfaceShown} />;
        interfaceShown = false;
        return view;
      })}
    </div>
  );
};

// src/utils/extract-json-chunks.ts
export function extractJsonChunks(content: string): Chunk[] {
  const chunks: Chunk[] = [];
  let buffer = '';
  let insideJson = false;
  let braceDepth = 0;

  const flushBuffer = () => {
    const trimmed = buffer.trim();
    if (trimmed) {
      try {
        chunks.push(processJsonChunk(trimmed));
      } catch {
        chunks.push(trimmed); // fallback to raw markdown
      }
    }
    buffer = '';
  };

  for (const line of content.split('\n')) {
    if (line.trim().startsWith('```json')) {
      insideJson = true;
      braceDepth = 0;
      continue;
    }
    if (line.trim().startsWith('```') && insideJson) {
      insideJson = false;
      flushBuffer();
      continue;
    }

    if (insideJson) {
      buffer += line + '\n';
    } else if (line.trim().startsWith('{')) {
      insideJson = true;
      braceDepth = 1;
      buffer = line + '\n';
    } else if (insideJson) {
      buffer += line + '\n';
      if (line.includes('{')) braceDepth++;
      if (line.includes('}')) braceDepth--;
      if (braceDepth === 0) {
        insideJson = false;
        flushBuffer();
      }
    } else {
      chunks.push(line + '\n');
    }
  }

  flushBuffer(); // catch any leftovers

  return chunks.filter(Boolean);
}
