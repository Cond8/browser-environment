// src/features/chat/components/chat-content.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyChatState } from '@/features/chat/components/empty-chat-state';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { ThreadMessage, useChatStore } from '../store/chat-store';
import { ErrorDisplay } from './error-display';
import { JsonParser } from './json-parser';

export const ChatContent = () => {
  const currentThread = useChatStore().getCurrentThread();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                <JsonParser displayContent={message.content} />
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
