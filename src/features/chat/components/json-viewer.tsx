// src/features/chat/components/json-viewer.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

type JsonViewerProps = {
  content: string;
  isStreaming?: boolean;
};

export const JsonViewer = ({ content, isStreaming = false }: JsonViewerProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [content]);

  return (
    <pre className="rounded-md bg-muted p-4 font-mono text-sm text-muted-foreground">
      <ScrollArea className="max-h-[400px] overflow-auto">
        <div className={cn('whitespace-pre-wrap', isStreaming && 'streaming-content')}>
          {content}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </pre>
  );
};
