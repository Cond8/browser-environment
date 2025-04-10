import React from 'react';
import { ChatTopBar } from './components/chat-top-bar';
import { ChatContent } from './components/chat-content';
import { SelectedModel } from './components/selected-model';
import { UserInput } from './components/user-input';

export const AssistantPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <ChatTopBar />
      <ChatContent />
      <UserInput />
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50">
        <SelectedModel />
      </div>
    </div>
  );
}; 