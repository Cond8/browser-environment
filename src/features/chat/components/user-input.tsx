// src/features/chat/components/user-input.tsx
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/features/chat/store/chat-store';
import { Send, StopCircle } from 'lucide-react';
import { useState } from 'react';
import { useEventBusStore } from '../store/eventbus-store';
import { useStreamStore } from '../store/stream-store';
import { SelectedModel } from './selected-model';
import { ShortcutsDisplay } from './shortcuts-display';

export function UserInput() {
  const [message, setMessage] = useState('I want to classify emails as spam or not spam');

  const addUserMessage = useChatStore(state => state.addUserMessage);
  const isStreaming = useStreamStore(state => state.isStreaming);
  const stopStreaming = useStreamStore(state => state.stopStreaming);
  const triggerAbort = useEventBusStore(state => state.triggerAbort);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    addUserMessage(trimmed);
    setMessage('');
  };

  const handleButtonSubmit = () => {
    console.log('[UserInput] Button submit triggered');
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();
      if (!isStreaming) {
        handleSubmit(e);
      }
    }
  };

  const handleStop = () => {
    console.log('[UserInput] Stop button clicked');
    triggerAbort();
    stopStreaming();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 border-t">
      <Textarea
        value={message}
        onChange={e => {
          setMessage(e.target.value);
        }}
        placeholder="Type your message..."
        className="min-h-[60px] resize-none"
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
      />
      <div className="flex items-center justify-between">
        <SelectedModel />
        <div className="flex items-center gap-2">
          <ShortcutsDisplay
            command="Stop"
            shortcut="Shift+Enter"
            asButton
            onClick={handleStop}
            hide={!isStreaming}
            icon={StopCircle}
          />
          <ShortcutsDisplay
            command="Send"
            shortcut="Shift+Enter"
            asButton
            onClick={handleButtonSubmit}
            hide={isStreaming}
            icon={Send}
          />
        </div>
      </div>
    </form>
  );
}
