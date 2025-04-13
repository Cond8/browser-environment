// src/features/chat/components/user-input.tsx
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/features/chat/store/chat-store';
import { useConnStore } from '@/features/ollama-api/store/conn-store';
import { Send, StopCircle } from 'lucide-react';
import { useState } from 'react';
import { useAbortEventBusStore } from '../../store/abort-eventbus-store';
import { SelectedModel } from './selected-model';
import { ShortcutsDisplay } from './shortcuts-display';

export function UserInput() {
  const [message, setMessage] = useState('I want to classify emails as spam or not spam');

  const addUserMessage = useChatStore(state => state.addUserMessage);
  const triggerAbort = useAbortEventBusStore(state => state.triggerAbort);
  const isLoading = useConnStore(state => state.isLoading);
  const setIsLoading = useConnStore(state => state.setIsLoading);
  const startWorkflowChain = useConnStore(state => state.startWorkflowChain);
  const stopLoading = useAbortEventBusStore(state => state.triggerAbort);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    addUserMessage(trimmed);
    setMessage('');
    await startWorkflowChain();
    setIsLoading(false);
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
      if (!isLoading) {
        handleSubmit(e);
      }
    }
  };

  const handleStop = () => {
    console.log('[UserInput] Stop button clicked');
    triggerAbort();
    stopLoading();
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
        disabled={isLoading}
      />
      <div className="flex items-center justify-between">
        <SelectedModel />
        <div className="flex items-center gap-2">
          <ShortcutsDisplay
            command="Stop"
            shortcut="Shift+Enter"
            asButton
            onClick={handleStop}
            hide={!isLoading}
            icon={StopCircle}
          />
          <ShortcutsDisplay
            command="Send"
            shortcut="Shift+Enter"
            asButton
            onClick={handleButtonSubmit}
            hide={isLoading}
            icon={Send}
          />
        </div>
      </div>
    </form>
  );
}
