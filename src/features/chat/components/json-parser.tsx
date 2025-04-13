import { Button } from '@/components/ui/button';
import { useVfsStore } from '@/features/vfs/store/vfs-store';
import { cn } from '@/lib/utils';
import { jsonrepair } from 'jsonrepair';
import { useStreamStore } from '../store/stream-store';
import { ErrorDisplay } from './error-display';
import InterfaceDetails from './json-interface-details';
import { JsonViewer } from './json-viewer';

type JsonParserProps = {
  content: string;
  messageId?: number; // Need message ID to check stream state
  isLatestAssistantMessage?: boolean; // Flag to know if this is potentially the streaming message
};

// Extract JSON from fenced blocks if available.
const extractJsonContent = (content: string): string => {
  const jsonFenceRegex = /```(?:json)?\n([\s\S]*?)```/;
  const match = content.match(jsonFenceRegex);
  return match ? match[1].trim() : content.trim();
};

// Check if content looks like it might be JSON
const looksLikeJson = (content: string): boolean => {
  const trimmed = content.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    content.includes('```json') ||
    (content.includes('```') && (trimmed.includes('{') || trimmed.includes('[')))
  );
};

export const JsonParser = ({ content, messageId, isLatestAssistantMessage }: JsonParserProps) => {
  const isStreaming = useStreamStore(state => state.isStreaming);
  const currentStreamingId = useStreamStore(state => state.currentMessageId);
  const vfsStore = useVfsStore();
  // Get the raw partial message content directly from stream store if streaming this message
  const partialMessageContent = useStreamStore(state =>
    isStreaming && currentStreamingId === messageId
      ? state.partialMessages[messageId]?.content
      : null,
  );

  // Determine if *this specific message* is the one currently being streamed
  const isCurrentlyStreamingThisMessage =
    isStreaming && currentStreamingId === messageId && isLatestAssistantMessage;

  // Use the partial content if this message is actively streaming, otherwise use the final content
  const displayContent = isCurrentlyStreamingThisMessage ? (partialMessageContent ?? '') : content;

  // --- Streaming Display Logic ---
  if (isCurrentlyStreamingThisMessage) {
    // Show raw, potentially incomplete JSON (or text) in the viewer
    return (
      <div className="p-4 bg-muted/30">
        <JsonViewer content={displayContent} isStreaming={true} />
      </div>
    );
  }

  // --- Final Content Display Logic ---
  // If content doesn't look like JSON, display as plain text
  if (!looksLikeJson(displayContent)) {
    return (
      <div className="p-4 bg-muted/30">
        <div className="whitespace-pre-wrap">{displayContent}</div>
      </div>
    );
  }

  let parsed: any;
  let parsingError: { message: string; type: string } | null = null;
  const jsonContent = extractJsonContent(displayContent);

  try {
    // Attempt to parse the extracted content first
    parsed = JSON.parse(jsonContent);
  } catch (e) {
    // If extracted content parsing fails, try repairing the content
    try {
      const repairedJson = jsonrepair(displayContent);
      parsed = JSON.parse(repairedJson);
    } catch (repairError) {
      parsingError = {
        message: `Initial parse failed: ${(e as Error).message}. Repair failed: ${(repairError as Error).message}`,
        type: 'JSONParsingError',
      };
    }
  }

  // If there was a parsing error after repair attempt, display it
  if (parsingError) {
    return (
      <ErrorDisplay
        error={parsingError}
        context={`Invalid JSON Content (length: ${displayContent.length})`}
      />
    );
  }

  // Check if the successfully parsed object is a valid workflow structure
  const isValidInterface =
    parsed != null &&
    typeof parsed === 'object' &&
    (('interface' in parsed && 'steps' in parsed) || 'service' in parsed || 'name' in parsed);

  const handleSaveToVfs = () => {
    if (isValidInterface && 'name' in parsed) {
      const workflowName = parsed.name;
      const workflowPath = `/workflows/${workflowName}`;

      // Check if workflow already exists
      const existingWorkflow = vfsStore.getNode(workflowPath);
      if (existingWorkflow) {
        // Update existing workflow
        if ('interface' in parsed) {
          vfsStore.commitInterface(workflowPath, parsed.interface);
        }
        if ('steps' in parsed) {
          vfsStore.commitSteps(workflowPath, parsed.steps);
        }
      } else {
        // Create new workflow
        vfsStore.createFile('/workflows', workflowName, 'workflow');
        if ('interface' in parsed) {
          vfsStore.commitInterface(workflowPath, parsed.interface);
        }
        if ('steps' in parsed) {
          vfsStore.commitSteps(workflowPath, parsed.steps);
        }
      }
    }
  };

  // If it's a valid workflow structure, display it with the save button
  if (isValidInterface) {
    return (
      <div className={cn('p-4', 'bg-muted/30')}>
        <div className="space-y-4">
          <InterfaceDetails data={parsed} />
          <Button onClick={handleSaveToVfs} className="mt-4" variant="outline">
            Save to VFS
          </Button>
        </div>
      </div>
    );
  }

  // If it's not a valid workflow structure but is valid JSON, display it as formatted JSON
  return (
    <div className={cn('p-4', 'bg-muted/30')}>
      <JsonViewer content={JSON.stringify(parsed, null, 2)} isStreaming={false} />
    </div>
  );
};
