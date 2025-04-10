import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useVercelUseChatRuntime } from '@assistant-ui/react-ai-sdk';
import { useChat } from '@ai-sdk/react';
import { DisconnectedScreen } from './disconnected-screen';
import { useEffect } from 'react';
import React from 'react';
import { useOllamaConnectionStore } from '../store/ollama-conn-store';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ollamaService, isOllamaAvailable, ollamaError, checkOllamaAvailability } = useOllamaConnectionStore();

  const chat = useChat({
    api: '/api/chat',
  });

  const runtime = useVercelUseChatRuntime(chat);

  useEffect(() => {
    if (!ollamaService) {
      useOllamaConnectionStore.getState().initializeOllamaService();
    }
  }, [ollamaService]);

  if (!isOllamaAvailable) {
    return (
      <DisconnectedScreen
        error={ollamaError || undefined}
        onRetry={checkOllamaAvailability}
      />
    );
  }

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};
