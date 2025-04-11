// src/features/chat/components/recent-threads.tsx
import React from 'react';
import { Clock, MessageCircle, Trash2, Hash } from 'lucide-react';
import { useChatStore } from '../store/chat-store';
import { ShortcutsDisplay } from '@/features/chat/components/shortcuts-display';

export const RecentThreads: React.FC = () => {
  const { getRecentThreads, getTimeAgo, getAssistantMessageCount, clearThreads } = useChatStore();
  const recentThreads = getRecentThreads(5);

  if (recentThreads.length === 0) return (
    <div className="w-full max-w-md mb-8 text-center">
      <span className="text-sm text-muted-foreground">No recent conversations</span>
    </div>
  );

  return (
    <div className="w-full max-w-md mb-8">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">Recent Conversations</h4>
        <ShortcutsDisplay
          command="Clear history"
          shortcut="⌘⇧⌫"
          className="text-muted-foreground hover:text-destructive"
          asButton
          icon={Trash2}
          onClick={clearThreads}
        />
      </div>
      <div className="space-y-2">
        {recentThreads.map((thread, index) => (
          <div
            key={thread.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{thread.title}</p>
                <ShortcutsDisplay
                  command={`Select thread ${index + 1}`}
                  shortcut={`⌘⇧${index + 1}`}
                  className="ml-2"
                  icon={Hash}
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{getTimeAgo(thread.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{getAssistantMessageCount(thread.id)} assistant messages</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 