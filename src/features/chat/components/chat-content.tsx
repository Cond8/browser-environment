// src/features/chat/components/chat-content.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyChatState } from '@/features/chat/components/empty-chat-state';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { ThreadMessage, useChatStore } from '../store/chat-store';
import { useStreamStore } from '../store/stream-store';
import { ErrorDisplay } from './error-display';
import { JsonParser } from './json-parser';

export const ChatContent = () => {
  const currentThread = useChatStore().getCurrentThread();
  const isStreaming = useStreamStore(state => state.isStreaming);
  const partialMessage = useStreamStore(state => state.partialMessages[state.currentMessageId!]);
  const streamError = useStreamStore(state => state.errors[state.currentMessageId!]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentThread?.messages.length, partialMessage?.content, isStreaming]);

  if (!currentThread) {
    return <EmptyChatState />;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col">
        {currentThread.messages.map((message: ThreadMessage) => (
          <div
            key={message.id}
            className={cn('w-full border-b', message.role === 'user' ? 'bg-card' : 'bg-background')}
          >
            {message.error ? (
              <ErrorDisplay error={message.error} />
            ) : (
              <JsonParser content={message.content} />
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="bg-background p-4 border-b">
            {partialMessage && <JsonParser content={partialMessage.content} />}

            {streamError && !partialMessage && (
              <ErrorDisplay error={streamError} context="Streaming Error" />
            )}

            {!partialMessage && !streamError && (
              <div className="flex space-x-2 mt-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]" />
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
