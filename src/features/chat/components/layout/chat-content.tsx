// src/features/chat/components/layout/chat-content.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStreamSourceStore } from '@/features/ollama-api/streaming/infra/stream-source-store';
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
          // Determine message error

          return (
            <div
              key={message.content}
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
        {isStreaming && streamMessage && (
          <div className="w-full border-b bg-background">
            <StreamingAssistantDisplay assistantMessage={streamMessage} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

const isAssistantMessage = (message: ThreadMessage): message is AssistantMessage => {
  return message.role === 'assistant';
};
