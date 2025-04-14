// src/features/chat/components/json/json-parser.tsx
import { Button } from '@/components/ui/button';
import { useVfsStore } from '@/features/vfs/store/vfs-store';
import { cn } from '@/lib/utils';
import { jsonrepair } from 'jsonrepair';
import { ErrorDisplay } from '../layout/error-display';
import InterfaceDetails from './json-interface-details';
import { JsonViewer } from './json-viewer';

type JsonParserProps = {
  displayContent: string;
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

// Validate the structure of a workflow object
const isValidWorkflowStructure = (obj: any): boolean => {
  if (!obj || typeof obj !== 'object') return false;

  // Check for interface structure
  if ('interface' in obj) {
    const interfaceObj = obj.interface;
    if (!interfaceObj || typeof interfaceObj !== 'object') return false;
    if (!interfaceObj.name || !interfaceObj.service || !interfaceObj.method || !interfaceObj.goal) return false;
    
    // Validate params format if present
    if (interfaceObj.params) {
      if (typeof interfaceObj.params !== 'object') return false;
      for (const [key, value] of Object.entries(interfaceObj.params)) {
        if (typeof value !== 'string') return false;
        if (!value.includes(' - ')) return false;
      }
    }
    
    // Validate returns format if present
    if (interfaceObj.returns) {
      if (typeof interfaceObj.returns !== 'object') return false;
      for (const [key, value] of Object.entries(interfaceObj.returns)) {
        if (typeof value !== 'string') return false;
        if (!value.includes(' - ')) return false;
      }
    }
  }

  // Check for steps structure
  if ('steps' in obj) {
    const steps = obj.steps;
    if (!Array.isArray(steps)) return false;
    for (const step of steps) {
      if (!step || typeof step !== 'object') return false;
      if (!step.name || !step.service || !step.method || !step.goal) return false;
      
      // Validate params format if present
      if (step.params) {
        if (typeof step.params !== 'object') return false;
        for (const [key, value] of Object.entries(step.params)) {
          if (typeof value !== 'string') return false;
          if (!value.includes(' - ')) return false;
        }
      }
      
      // Validate returns format if present
      if (step.returns) {
        if (typeof step.returns !== 'object') return false;
        for (const [key, value] of Object.entries(step.returns)) {
          if (typeof value !== 'string') return false;
          if (!value.includes(' - ')) return false;
        }
      }
    }
  }

  return true;
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
  const isValidInterface = isValidWorkflowStructure(parsed);

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
