// src/features/chat/components/layout/chat-top-bar.tsx
import { Plus } from 'lucide-react';
import React from 'react';
import { useChatStore } from '../../store/chat-store';
import { ShortcutsDisplay } from '../ui/shortcuts-display';

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
        icon={Plus}
      />
    </div>
  );
};
