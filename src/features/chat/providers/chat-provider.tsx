import React, { createContext, useContext, ReactNode } from 'react';
import { useChatStore } from '../stores/chat-store';
import { useWorkflowStore } from '../stores/workflow-store';
import { useEditorStore } from '../../../features/editor/stores/editor-store';

// Define the context type
interface ChatContextType {
  // This context mainly serves as a way to access the stores
  initialized: boolean;
}

// Create the context with a default value
const ChatContext = createContext<ChatContextType>({
  initialized: false,
});

// Hook to use the chat context
export const useChatContext = () => useContext(ChatContext);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // Initialize any global state here
  const initialized = true;

  // Use stores if you need to initialize anything
  const chatStore = useChatStore();
  const workflowStore = useWorkflowStore();
  const editorStore = useEditorStore();

  // Create a context value
  const contextValue: ChatContextType = {
    initialized,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}; 