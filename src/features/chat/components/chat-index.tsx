import { ThreadPrimitive } from '@assistant-ui/react';
import React from 'react';
import { ChatProvider } from './chat-provider';
import { EmptyState } from './empty-state-screen';
import { Thread } from './ui/thread';

export const ChatIndex: React.FC = () => {
  return (
    <ChatProvider>
      <ThreadPrimitive.Root className="h-full">
        <ThreadPrimitive.If empty>
          <div className="h-full">
            <div className="h-full">
              <EmptyState />
            </div>
          </div>
        </ThreadPrimitive.If>
        <ThreadPrimitive.If empty={false}>
          <div className="h-full">
            <div className="h-full">
              <Thread />
            </div>
          </div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Root>
    </ChatProvider>
  );
};
