import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useVercelUseChatRuntime } from '@assistant-ui/react-ai-sdk';
import { useChat } from '@ai-sdk/react';
import React, { useEffect } from 'react';
import { useChatStore } from '../store/chat-store';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initializeOllamaService = useChatStore(state => state.initializeOllamaService);
  
  const chat = useChat({
    api: '/api/chat',
  });

  const runtime = useVercelUseChatRuntime(chat);

  useEffect(() => {
    initializeOllamaService();
  }, [initializeOllamaService]);

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};
