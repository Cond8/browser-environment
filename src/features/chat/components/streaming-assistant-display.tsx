import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdown-components';

interface StreamingAssistantDisplayProps {
  assistantMessage: string;
}

export const StreamingAssistantDisplay = ({ assistantMessage }: StreamingAssistantDisplayProps) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {assistantMessage}
      </ReactMarkdown>
    </div>
  );
};
