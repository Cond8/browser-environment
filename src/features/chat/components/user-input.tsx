import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square } from 'lucide-react';
import { useState } from 'react';
import { useChatStore } from '@/features/chat/store/chat-store';

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
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="min-h-[60px] resize-none"
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
      />
      <Button
        type="submit"
        size="icon"
        className="self-end"
        onClick={isStreaming ? stopStreaming : undefined}
      >
        {isStreaming ? (
          <Square className="h-4 w-4" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
