// src/features/chat/components/streaming-assistant-display.tsx
import { useStreamSourceStore } from '@/features/ollama-api/streaming-logic/infra/stream-source-store';
import { useMemo } from 'react';
import { StreamingAssistantMessage } from '../models/assistant-message';
import { AssistantDisplay } from './assistant-display';

export const StreamingAssistantDisplay = () => {
  const isStreaming = useStreamSourceStore(state => state.isStreaming);
  const streamMessage = useStreamSourceStore(state => state.message);

  // Create a new StreamingAssistantMessage on each render when the streamMessage changes
  const assistantMessage = useMemo(() => {
    return StreamingAssistantMessage.fromContent(streamMessage || '');
  }, [streamMessage]);

  if (!isStreaming) {
    return null;
  }

  return <AssistantDisplay assistantMessage={assistantMessage} isStreaming={isStreaming} />;
};
