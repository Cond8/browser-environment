// src/features/chat/components/chat-content.tsx
import { useChatStore } from '../store/chat-store';
import { cn } from '@/lib/utils';
import { EmptyChatState } from '@/features/chat/components/empty-chat-state';

export const ChatContent = () => {
  const { threads, currentThreadId, isStreaming } = useChatStore();
  const currentThread = threads.find(thread => thread.id === currentThreadId);

  if (!currentThread) {
    return (
      <EmptyChatState />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-4">
        {currentThread.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'w-full',
              message.role === 'user' ? 'bg-card' : 'bg-background'
            )}
          >
            <p className="whitespace-pre-wrap p-4">{message.content}</p>
          </div>
        ))}
        {isStreaming && (
          <div className="bg-background p-4">
            <div className="flex space-x-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
