// src/features/chat/index.tsx
import React from 'react';
import { ChatContent } from './components/chat-content';
import { ChatTopBar } from './components/chat-top-bar';
import { UserInput } from './components/user-input';

export const AssistantPanel: React.FC = () => {
  console.log('[AssistantPanel] Rendering main chat component');

  return (
    <div className="h-full flex flex-col">
      <ChatTopBar />
      <ChatContent />
      <UserInput />
    </div>
  );
};
