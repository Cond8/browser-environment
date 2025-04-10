import { SelectedModel } from './selected-model';
import { ConnectionStatus } from './connection-status';

export function ChatBottomControls() {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50">
      <SelectedModel />
      <ConnectionStatus />
    </div>
  );
} 