// src/features/chat/components/assistant-display.tsx
import { cn } from '@/lib/utils';
import InterfaceDetails from './json/json-interface-details';
import { JsonViewer } from './json/json-viewer';
import { ErrorDisplay } from './layout/error-display';

type MessageDisplayProps = {
  content: string;
  type: 'alignment' | 'interface' | 'steps';
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
    const parsed = JSON.parse(content);

    // For interface messages (single WorkflowStep)
    if (type === 'interface') {
      return (
        <div className={cn('p-4', 'bg-muted/30')}>
          <InterfaceDetails data={{ interface: parsed }} />
        </div>
      );
    }

    // For steps messages (WorkflowStep[])
    if (type === 'steps') {
      return (
        <div className={cn('p-4', 'bg-muted/30')}>
          <InterfaceDetails data={{ steps: parsed }} />
        </div>
      );
    }

    // Fallback for any other JSON content
    return (
      <div className={cn('p-4', 'bg-muted/30')}>
        <JsonViewer content={JSON.stringify(parsed, null, 2)} isStreaming={false} />
      </div>
    );
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
