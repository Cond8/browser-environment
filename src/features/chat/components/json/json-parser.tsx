// src/features/chat/components/json/json-parser.tsx
import { Button } from '@/components/ui/button';
import { useVfsStore } from '@/features/vfs/store/vfs-store';
import { cn } from '@/lib/utils';
import { parseOrRepairJson } from '@/features/ollama-api/llm-output-fixer';
import { ErrorDisplay } from '../layout/error-display';
import InterfaceDetails from './json-interface-details';
import { JsonViewer } from './json-viewer';
import { WorkflowStep } from '@/features/ollama-api/tool-schemas/workflow-schema';

type JsonParserProps = {
  displayContent: string;
};

interface WorkflowData {
  interface?: WorkflowStep;
  steps?: WorkflowStep[];
  name?: string;
  service?: string;
}

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

// Normalize the parsed data into a consistent format
const normalizeWorkflowData = (parsed: any): WorkflowData => {
  // If it's an array, treat it as steps
  if (Array.isArray(parsed)) {
    return { steps: parsed };
  }
  
  // If it's an object with steps, return as is
  if (typeof parsed === 'object' && 'steps' in parsed) {
    return parsed;
  }
  
  // If it's a single step object, wrap it in an array
  if (typeof parsed === 'object' && 'name' in parsed && 'service' in parsed) {
    return { steps: [parsed] };
  }
  
  // Otherwise return as is
  return parsed;
};

export const JsonParser = ({ displayContent }: JsonParserProps) => {
  const vfsStore = useVfsStore();

  // --- Final Content Display Logic ---
  // If content doesn't look like JSON, display as plain text
  if (!looksLikeJson(displayContent)) {
    return (
      <div className="p-4 bg-muted/30">
        <div className="whitespace-pre-wrap">{displayContent}</div>
      </div>
    );
  }

  const jsonContent = extractJsonContent(displayContent);
  const parsed = parseOrRepairJson<any>(jsonContent);
  const normalizedData = normalizeWorkflowData(parsed);

  // If parsing failed, display error
  if (!parsed) {
    return (
      <ErrorDisplay
        error={{ message: 'Failed to parse JSON content', type: 'JSONParsingError' }}
        context={`Invalid JSON Content (length: ${displayContent.length})`}
      />
    );
  }

  // Check if the parsed object has the basic structure of a workflow
  const isValidInterface = 
    normalizedData != null &&
    (('interface' in normalizedData && 'steps' in normalizedData) || 
     ('steps' in normalizedData && Array.isArray(normalizedData.steps)) ||
     ('service' in normalizedData && 'name' in normalizedData));

  const handleSaveToVfs = () => {
    if (isValidInterface && 'name' in normalizedData) {
      const workflowName = normalizedData.name;
      const workflowPath = `/workflows/${workflowName}`;

      // Check if workflow already exists
      const existingWorkflow = vfsStore.getNode(workflowPath);
      if (existingWorkflow) {
        // Update existing workflow
        if ('interface' in normalizedData) {
          vfsStore.commitInterface(workflowPath, normalizedData.interface);
        }
        if ('steps' in normalizedData) {
          vfsStore.commitSteps(workflowPath, normalizedData.steps);
        }
      } else {
        // Create new workflow
        vfsStore.createFile('/workflows', workflowName, 'workflow');
        if ('interface' in normalizedData) {
          vfsStore.commitInterface(workflowPath, normalizedData.interface);
        }
        if ('steps' in normalizedData) {
          vfsStore.commitSteps(workflowPath, normalizedData.steps);
        }
      }
    }
  };

  // If it's a valid workflow structure, display it with the save button
  if (isValidInterface) {
    return (
      <div className={cn('p-4', 'bg-muted/30')}>
        <div className="space-y-4">
          <InterfaceDetails data={normalizedData} />
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
