// src/features/chat/components/layout/chat-content.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStreamSourceStore } from '@/features/ollama-api/streaming-logic/infra/stream-source-store';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { ThreadMessage } from '../../models/message';
import { useChatStore } from '../../store/chat-store';
import { AssistantDisplay } from '../assistant-display';
import { EmptyChatState } from '../empty/empty-chat-state';
import { StreamingAssistantDisplay } from '../streaming-assistant-display';
import { UserDisplay } from '../user-display';

export const ChatContent = () => {
  const currentThread = useChatStore().getCurrentThread();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamMessage = useStreamSourceStore(state => state.message);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentThread?.messages.length, streamMessage]);

  if (!currentThread) {
    return <EmptyChatState />;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col max-w-2xl mx-auto w-full break-words px-6 py-4 space-y-4">
        {currentThread.messages.map((message: ThreadMessage) => {
          const key = `${message.role}-${message.timestamp}`;
          return (
            <div
              key={key}
              className={cn(
                'w-full border-b',
                message.role === 'user' ? 'bg-card' : 'bg-background',
              )}
            >
              {message.role === 'assistant' ? (
                <AssistantDisplay assistantMessage={message.content} />
              ) : (
                <UserDisplay content={message.content} />
              )}
            </div>
          );
        })}
        <StreamingAssistantDisplay />
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
