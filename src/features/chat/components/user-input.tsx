import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Delete, CornerDownLeft } from 'lucide-react';
import { useState } from 'react';
import { useChatStore } from '@/features/chat/store/chat-store';
import { ShortcutsDisplay } from './shortcuts-display';

export function UserInput() {
  const [message, setMessage] = useState('');

  const addMessage = useChatStore(state => state.addMessage);
  const isStreaming = useChatStore(state => state.isStreaming);
  const startStreaming = useChatStore(state => state.startStreaming);
  const stopStreaming = useChatStore(state => state.stopStreaming);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    addMessage({
      role: 'user',
      content: trimmed,
    });

    setMessage('');
    startStreaming();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) {
        handleSubmit(e);
      } else {
        stopStreaming();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 border-t">
      <Textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="min-h-[60px] resize-none"
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <ShortcutsDisplay 
            command="Send message"
            shortcut="Enter"
            hide={isStreaming}
          />
          <ShortcutsDisplay 
            command="New line"
            shortcut="Shift+Enter"
            chained
            hide={isStreaming}
          />
        </div>
        <ShortcutsDisplay 
          command="Stop streaming"
          shortcut="Shift+Ctrl+Backspace"
          hide={!isStreaming}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={stopStreaming}
            disabled={!isStreaming}
          >
            Stop
            <Delete className="h-4 w-4 translate-y-[2px]" />
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={!message.trim()}
          >
            Send
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
