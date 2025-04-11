// src/features/chat/components/chat-top-bar.tsx
import React from 'react';
import { ShortcutsDisplay } from './shortcuts-display';
import { useChatStore } from '../store/chat-store';

export const ChatTopBar: React.FC = () => {
  const setCurrentThread = useChatStore(state => state.setCurrentThread);

  return (
    <div className="p-4 border-b">
      <h2 className="text-sm font-semibold">Chat Assistant</h2>
      <ShortcutsDisplay
        command="New Chat"
        shortcut="⌘N"
        asButton
        onClick={() => {
          setCurrentThread(null);
        }}
      />
    </div>
  );
}; 