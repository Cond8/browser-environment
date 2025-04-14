// src/features/chat/components/assistant-display.tsx
import { cn } from '@/lib/utils';
import { ErrorDisplay } from './layout/error-display';

type MessageDisplayProps = {
  content: string;
  type: 'alignment' | 'interface' | 'step';
};

export const AssistantDisplay = ({ content, type }: MessageDisplayProps) => {
  // For alignment messages (plain text)
  if (type === 'alignment') {
    return (
      <div className="p-4 bg-muted/30">
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    );
  }

  // For interface and steps messages (JSON)
  try {
    // Fallback for any other JSON content
    return <div className={cn('p-4', 'bg-muted/30')}>{content}</div>;
  } catch (error) {
    return (
      <ErrorDisplay
        error={{
          message: `Failed to parse ${type} content: ${(error as Error).message}`,
          type: 'JSONParsingError',
        }}
        context={`Invalid ${type} Content (length: ${content.length})`}
      />
    );
  }
};
