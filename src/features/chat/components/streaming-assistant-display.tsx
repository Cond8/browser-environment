// src/features/chat/components/streaming-assistant-display.tsx
import { useRetryEventBusStore } from '@/features/ollama-api/stores/retry-event-bus-store';
import { useStreamSourceStore } from '@/features/ollama-api/streaming-logic/infra/stream-source-store';
import { useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { StreamingAssistantMessage } from '../models/assistant-message';
import { AssistantDisplay } from './assistant-display';

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert" className="p-4 border border-red-300 rounded bg-red-50">
      <p className="text-red-700 font-semibold">Something went wrong:</p>
      <pre className="text-red-600 mt-2">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Try again
      </button>
    </div>
  );
}

export const StreamingAssistantDisplay = () => {
  const isStreaming = useStreamSourceStore(state => state.isStreaming);
  const streamMessage = useStreamSourceStore(state => state.message);

  // Use ref to keep stable instance identity across renders
  const assistantMessageRef = useRef<StreamingAssistantMessage | null>(null);

  // Initialize or reset the message when streaming starts/stops
  useEffect(() => {
    if (!isStreaming || !assistantMessageRef.current) {
      // Reset on fresh stream start or if streaming ends
      assistantMessageRef.current = StreamingAssistantMessage.fromContent('');
    }
  }, [isStreaming]);

  // Update the message content when streamMessage changes
  useEffect(() => {
    if (isStreaming && typeof streamMessage === 'string' && streamMessage.trim()) {
      if (!assistantMessageRef.current) {
        // Initialize if needed
        assistantMessageRef.current = StreamingAssistantMessage.fromContent(streamMessage.trim());
      } else {
        // Add tokens for incremental updates
        const newContent = streamMessage.trim();
        const currentContent = assistantMessageRef.current.content;

        // Only update if there's new content to avoid redundant parsing
        if (newContent !== currentContent) {
          // Find the new tokens that were added
          const newTokens = newContent.slice(currentContent.length);
          if (newTokens) {
            assistantMessageRef.current.addToken(newTokens);
          }
        }
      }
    }
  }, [streamMessage, isStreaming]);

  if (!isStreaming) {
    return null;
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the retry count when the error boundary resets
        useRetryEventBusStore.getState().resetRetryCount('step');
      }}
    >
      <AssistantDisplay
        assistantMessage={assistantMessageRef.current || StreamingAssistantMessage.fromContent('')}
        isStreaming={isStreaming}
      />
    </ErrorBoundary>
  );
};
