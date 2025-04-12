import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

export const JsonViewer = ({ content, error }: { content: string; error?: string | null }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [content]);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

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
