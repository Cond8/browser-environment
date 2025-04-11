// src/features/chat/components/user-input.tsx
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useChatStore } from '@/features/chat/store/chat-store';
import { ShortcutsDisplay } from './shortcuts-display';
import { SelectedModel } from './selected-model';
import { StopCircle, Send } from 'lucide-react';

export function UserInput() {
  const [message, setMessage] = useState('');

  const addMessage = useChatStore(state => state.addMessage);
  const isStreaming = useChatStore(state => state.isStreaming);
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
  };

  const handleButtonSubmit = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        if (!isStreaming) {
          handleSubmit(e);
        } else {
          stopStreaming();
        }
      }
      // Let Enter key create new line by default
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
        <SelectedModel />
        <div className="flex items-center gap-2">
          <ShortcutsDisplay 
            command="Stop"
            shortcut="Shift + Enter"
            asButton
            onClick={stopStreaming}
            hide={!isStreaming}
            icon={StopCircle}
          />
          <ShortcutsDisplay 
            command="Send"
            shortcut="Shift + Enter"
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
