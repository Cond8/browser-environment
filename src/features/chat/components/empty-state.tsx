import { MessageSquare } from 'lucide-react';
import React from 'react';
import { ConnectionStatus } from './connection-status';
import { SelectedModel } from './selected-model';
import { ThreadList } from './ui/thread-list';
import { UserInput } from './ui/user-input';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-4 mb-2">
          <SelectedModel />
          <ConnectionStatus url="/api" />
        </div>
        <UserInput />
      </div>

      <div className="flex-1 flex overflow-auto">
        <div className="flex flex-col items-center justify-center w-full min-h-full p-8 text-center">
          <div className="w-24 h-24 mb-4 text-gray-400">
            <MessageSquare className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active conversations</h3>
          <p className="text-gray-500 max-w-sm">
            Start a new conversation or select an existing one from below to get started.
          </p>
        </div>
      </div>

      <div className="border-t">
        <div className="max-w-2xl mx-auto p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Recent conversations</h4>
          <ThreadList />
        </div>
      </div>
    </div>
  );
};
