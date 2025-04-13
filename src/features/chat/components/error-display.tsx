import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: {
    message: string;
    type: string;
    details?: {
      phase?: 'interface' | 'steps' | 'stream';
      validationErrors?: string[];
      context?: Record<string, unknown>;
    } | null;
  };
  context?: string; // Optional context string like "Streaming Error"
}

export const ErrorDisplay = ({ error, context }: ErrorDisplayProps) => {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{context || error.type || 'Error'}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
        {error.details && (
          <div className="mt-3 pt-3 border-t border-destructive/30">
            <p className="text-xs font-semibold mb-1">Details:</p>
            <ul className="space-y-1 text-xs list-none">
              {error.details.phase && (
                <li>
                  <strong>Phase:</strong> {error.details.phase}
                </li>
              )}
              {error.details.validationErrors && error.details.validationErrors.length > 0 && (
                <li>
                  <strong>Validation Errors:</strong>
                  <ul className="list-disc pl-4 mt-1">
                    {error.details.validationErrors.map((valErr, index) => (
                      <li key={index}>{valErr}</li>
                    ))}
                  </ul>
                </li>
              )}
              {error.details.context && Object.keys(error.details.context).length > 0 && (
                <li>
                  <strong>Context:</strong>
                  <ScrollArea className="max-h-40 mt-1 rounded border border-destructive/20 bg-destructive/5 p-2">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(error.details.context, null, 2)}
                    </pre>
                  </ScrollArea>
                </li>
              )}
            </ul>
          </div>
        )}
      </Alert>
    </div>
  );
};
