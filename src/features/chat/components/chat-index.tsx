import { ThreadPrimitive } from '@assistant-ui/react';
import React from 'react';
import { ChatProvider } from './chat-provider';
import { EmptyState } from './empty-state';
import { Thread } from './ui/thread';

export const ChatIndex: React.FC = () => {
  return (
    <ChatProvider>
      <ThreadPrimitive.Root>
        <ThreadPrimitive.If empty>
          <EmptyState />
        </ThreadPrimitive.If>
        <ThreadPrimitive.If empty={false}>
          <div className="flex h-full">
            {/* Main Chat Area */}
            <div className="flex-1">
              <Thread />
            </div>
          </div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Root>
    </ChatProvider>
  );
};
