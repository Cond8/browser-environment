// src/features/chat/index.tsx
import React from 'react';
import { ChatTopBar } from './components/chat-top-bar';
import { ChatContent } from './components/chat-content';
import { UserInput } from './components/user-input';
import { ChatRunner } from './components/_chat-runner';

export const AssistantPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <ChatTopBar />
      <ChatContent />
      <UserInput />
      <ChatRunner />
    </div>
  );
}; 