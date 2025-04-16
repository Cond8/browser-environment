import { useStreamSourceStore } from '@/features/ollama-api/streaming/infra/stream-source-store';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdown-components';

export const StreamingAssistantDisplay = () => {
  const isStreaming = useStreamSourceStore(state => state.isStreaming);
  const streamMessage = useStreamSourceStore(state => state.message);
  return (
    <div
      className={cn(
        'prose dark:prose-invert max-w-none p-4',
        isStreaming ? 'animate-pulse' : 'display-none',
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {streamMessage}
      </ReactMarkdown>
    </div>
  );
};
