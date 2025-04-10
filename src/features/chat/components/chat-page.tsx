import React from 'react';
import { ChatInterface } from './chat-interface';
import { useChatStore, Conversation } from '../stores/chat-store';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';

export const ChatPage: React.FC = () => {
  const { conversations, currentConversationId, setCurrentConversation, createConversation, deleteConversation } = useChatStore();

  const handleNewConversation = () => {
    createConversation();
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(id);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-64 border-r bg-muted/50">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={handleNewConversation}
          >
            New Chat
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-2">
            {Object.values(conversations)
              .sort((a: Conversation, b: Conversation) => b.updatedAt - a.updatedAt)
              .map((conversation: Conversation) => (
                <div
                  key={conversation.id}
                  className={`p-2 rounded-md cursor-pointer flex justify-between items-center mb-1 hover:bg-muted ${
                    conversation.id === currentConversationId ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <span className="text-sm truncate flex-1">{conversation.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleDeleteConversation(e, conversation.id)}
                  >
                    ×
                  </Button>
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
}; 