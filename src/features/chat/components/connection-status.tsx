import { CheckCircle2, XCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
}

export function ConnectionStatus({ isConnected, error }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <div className="flex items-center gap-1 text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">Connected</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-500">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">Disconnected</span>
        </div>
      )}
      {error && (
        <div className="text-xs text-muted-foreground" title={error}>
          {error}
        </div>
      )}
    </div>
  );
} 