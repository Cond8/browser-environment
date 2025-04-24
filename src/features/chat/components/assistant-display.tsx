// src/features/chat/components/assistant-display.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdown-components';

interface AssistantDisplayProps {
  assistantMessage: string;
}

export const AssistantDisplay = ({ assistantMessage }: AssistantDisplayProps) => {
  return (
    <div className="overflow-hidden p-4">
      <div className="prose max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {assistantMessage}
        </ReactMarkdown>
      </div>
    </div>
  );
};
