// src/features/chat/components/yaml-viewer.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

export const YamlViewer = ({ content }: { content: string }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [content]);

  return (
    <pre className="rounded-md bg-muted p-4 font-mono text-sm text-muted-foreground">
      <ScrollArea className="max-h-[400px] overflow-auto">
        <div className="whitespace-pre-wrap">
          {content}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </pre>
  );
};
