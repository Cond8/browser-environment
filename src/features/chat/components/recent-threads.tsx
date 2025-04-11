import React from 'react';
import { Clock, MessageCircle } from 'lucide-react';
import { useChatStore } from '../store/chat-store';

export const RecentThreads: React.FC = () => {
  const { getRecentThreads, getTimeAgo, getAssistantMessageCount } = useChatStore();
  const recentThreads = getRecentThreads();

  if (recentThreads.length === 0) return (
    <div className="w-full max-w-md mb-8 text-center">
      <span className="text-sm text-muted-foreground">No recent conversations</span>
    </div>
  );

  return (
    <div className="w-full max-w-md mb-8">
      <h4 className="text-sm font-medium mb-4">Recent Conversations</h4>
      <div className="space-y-2">
        {recentThreads.map((thread) => (
          <div
            key={thread.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{thread.title}</p>
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