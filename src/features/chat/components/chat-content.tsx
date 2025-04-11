// src/features/chat/components/chat-content.tsx
import { EmptyChatState } from '@/features/chat/components/empty-chat-state';
import { cn } from '@/lib/utils';
import { useChatStore } from '../store/chat-store';
import { useStreamStore } from '../store/stream-store';
export const ChatContent = () => {
  const { threads, currentThreadId } = useChatStore();
  const currentThread = threads[currentThreadId!];
  const isStreaming = useStreamStore(state => state.isStreaming);
  const partialMessage = useStreamStore(state => state.partialAssistantMessage);

  if (!currentThread) {
    return <EmptyChatState />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-4">
        {currentThread.messages.map(message => (
          <div
            key={message.id}
            className={cn('w-full', message.role === 'user' ? 'bg-card' : 'bg-background')}
          >
            <p className="whitespace-pre-wrap p-4">{message.content}</p>
          </div>
        ))}
        {isStreaming && partialMessage && (
          <div className="bg-background p-4">
            <p className="whitespace-pre-wrap p-4">{partialMessage.content}</p>
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
