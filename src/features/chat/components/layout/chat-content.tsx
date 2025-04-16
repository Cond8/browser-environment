// src/features/chat/components/layout/chat-content.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { AssistantMessage } from '../../models/assistant-message';
import { ThreadMessage, useChatStore } from '../../store/chat-store';
import { AssistantDisplay } from '../assistant-display';
import { EmptyChatState } from '../empty/empty-chat-state';
import { StreamingAssistantDisplay } from '../streaming-assistant-display';
import { UserDisplay } from '../user-display';

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
      <div className="flex flex-col max-w-2xl mx-auto w-full break-words whitespace-pre-wrap">
        {currentThread.messages.map((message: ThreadMessage, idx: number) => {
          // Determine message error

          return (
            <div
              key={idx}
              className={cn(
                'w-full border-b',
                message.role === 'user' ? 'bg-card' : 'bg-background',
              )}
            >
              {isAssistantMessage(message) ? (
                <AssistantDisplay assistantMessage={message} />
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

const isAssistantMessage = (message: ThreadMessage): message is AssistantMessage => {
  console.log('isAssistantMessage', message);
  return message.role === 'assistant';
};
