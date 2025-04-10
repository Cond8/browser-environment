import { CheckCircle2, XCircle } from 'lucide-react';
import { useOllamaStore } from '../store/ollama-store';

export function ConnectionStatus() {
  const { isConnected, connectionError } = useOllamaStore();
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
      {connectionError && (
        <div className="text-xs text-muted-foreground" title={connectionError}>
          {connectionError}
        </div>
      )}
    </div>
  );
} 