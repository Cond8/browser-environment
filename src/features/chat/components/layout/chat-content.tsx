// src/features/chat/components/layout/chat-content.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStreamSourceStore } from '@/features/ollama-api/streaming/infra/stream-source-store';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { ThreadMessage, useChatStore } from '../../store/chat-store';
import { AssistantDisplay } from '../assistant-display';
import { EmptyChatState } from '../empty/empty-chat-state';
import { ErrorDisplay } from './error-display';

export const ChatContent = () => {
  const currentThread = useChatStore().getCurrentThread();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreaming = useStreamSourceStore(state => state.isStreaming);
  const streamMessage = useStreamSourceStore(state => state.message);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentThread?.messages.length]);

  if (!currentThread) {
    return <EmptyChatState />;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col">
        {currentThread.messages.map((message: ThreadMessage) => {
          return (
            <div
              key={message.id}
              className={cn(
                'w-full border-b',
                message.role === 'user' ? 'bg-card' : 'bg-background',
              )}
            >
              {message.error ? (
                <ErrorDisplay error={message.error} />
              ) : (
                <AssistantDisplay content={message.content} type={message.type} />
              )}
            </div>
          );
        })}
        {isStreaming && <AssistantDisplay content={streamMessage} type={'alignment'} />}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
