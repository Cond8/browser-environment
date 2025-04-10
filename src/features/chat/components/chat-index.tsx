import React from 'react';
import { ThreadList } from './ui/thread-list';
import { Thread } from './ui/thread';
import { ChatProvider } from './chat-provider';

export const ChatIndex: React.FC = () => {
  return (
    <ChatProvider>
      <div className="flex h-full">
        {/* Thread List Sidebar */}
        <div className="w-64 border-r">
          <ThreadList />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1">
          <Thread />
        </div>
      </div>
    </ChatProvider>
  );
};
