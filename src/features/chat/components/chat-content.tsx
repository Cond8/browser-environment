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

  const messages = currentThread.messages;
  const lastAssistantMessageIndex = messages
    .map((msg, idx) => ({ idx, isAssistant: msg.role === 'assistant' }))
    .filter(item => item.isAssistant)
    .pop()?.idx;

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col">
        {currentThread.messages.map((message: ThreadMessage, index: number) => {
          const isAssistant = message.role === 'assistant';
          const isLatestAssistantMessage = isAssistant && index === lastAssistantMessageIndex;

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
                <JsonParser
                  content={message.content}
                  messageId={message.id}
                  isLatestAssistantMessage={isLatestAssistantMessage}
                />
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
