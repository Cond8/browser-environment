import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: {
    message: string;
    type: string;
    details?: {
      phase?: 'interface' | 'steps' | 'stream' | 'alignment';
      validationErrors?: string[];
      context?: Record<string, unknown>;
    } | null;
  };
  context?: string; // Optional context string like "Streaming Error"
}

export const ErrorDisplay = ({ error, context }: ErrorDisplayProps) => {
  return (
    <div className="p-6 w-full">
      <Alert variant="destructive" className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <AlertTitle className="text-lg mb-2">{context || error.type || 'Error'}</AlertTitle>
            <AlertDescription className="text-base whitespace-normal break-words">
              {error.message}
            </AlertDescription>
          </div>
        </div>

        {error.details && (
          <div className="mt-4 pt-4 border-t border-destructive/30">
            <p className="text-sm font-semibold mb-2">Details:</p>
            <div className="space-y-3">
              {error.details.phase && (
                <div>
                  <strong className="text-sm">Phase:</strong>
                  <span className="ml-2 text-sm">{error.details.phase}</span>
                </div>
              )}

              {error.details.validationErrors && error.details.validationErrors.length > 0 && (
                <div>
                  <strong className="text-sm">Validation Errors:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {error.details.validationErrors.map((valErr, index) => (
                      <li key={index} className="text-sm">
                        {valErr}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error.details.context && Object.keys(error.details.context).length > 0 && (
                <div>
                  <strong className="text-sm">Context:</strong>
                  <ScrollArea className="h-auto max-h-48 mt-2 rounded border border-destructive/20 bg-destructive/5">
                    <pre className="p-3 text-sm whitespace-pre-wrap break-words">
                      {JSON.stringify(error.details.context, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        )}
      </Alert>
    </div>
  );
};
