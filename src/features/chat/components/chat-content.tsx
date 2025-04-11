import React from 'react';
import { useChatStore } from '../store/chat-store';
import { cn } from '@/lib/utils';
import { EmptyChatState } from '@/features/chat/components/empty-chat-state';

export const ChatContent: React.FC = () => {
  const { threads, currentThreadId, isStreaming } = useChatStore();
  const currentThread = threads.find(thread => thread.id === currentThreadId);

  if (!currentThread) {
    return (
      <EmptyChatState
        title="No chat selected"
        description="Select a chat or start a new conversation"
        showShortcuts={true}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-4 p-4">
        {currentThread.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex w-full',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-4 py-2',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 