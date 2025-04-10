import React from 'react';
import { ChatTopBar } from './components/chat-top-bar';
import { ChatContent } from './components/chat-content';
import { ChatInput } from './components/chat-input';
import { ChatBottomControls } from './components/chat-bottom-controls';

export const AssistantPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <ChatTopBar />
      <ChatContent />
      <ChatInput />
      <ChatBottomControls />
    </div>
  );
}; 