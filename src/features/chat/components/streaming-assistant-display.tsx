// src/features/chat/components/streaming-assistant-display.tsx
import { useStreamSourceStore } from '../../ollama-api/streaming-logic/infra/stream-source-store';
import { AssistantDisplay } from './assistant-display';

export const StreamingAssistantDisplay = () => {
  const { isStreaming, message } = useStreamSourceStore();

  if (!isStreaming || !message) {
    return null;
  }

  return (
    <div className="max-h-60 overflow-y-auto border rounded-lg bg-background shadow p-2">
      <AssistantDisplay assistantMessage={message} />
    </div>
  );
};
