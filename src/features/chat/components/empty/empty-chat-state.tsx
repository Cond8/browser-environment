// src/features/chat/components/empty/empty-chat-state.tsx
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import React from 'react';
import { RecentThreads } from './recent-threads';
import { ShortcutsCheatsheet } from './shortcuts-cheatsheet';

const SHORTCUTS = [
  { command: 'New Chat', shortcut: '⌘N' },
  { command: 'Search', shortcut: '⌘K' },
  { command: 'Settings', shortcut: '⌘,', chained: true },
];

interface EmptyChatStateProps {
  className?: string;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ className }) => (
  <div className={cn('flex h-full w-full flex-col items-center justify-between p-8', className)}>
    <RecentThreads />
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">Welcome to Cond8 Chat</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Start a new conversation or use the shortcuts below
      </p>
    </div>
    <ShortcutsCheatsheet shortcuts={SHORTCUTS} />
  </div>
);
