// src/features/chat/components/streaming-assistant-display.tsx
import { useRetryEventBusStore } from '@/features/ollama-api/stores/retry-event-bus-store';
import { useStreamSourceStore } from '@/features/ollama-api/streaming-logic/infra/stream-source-store';

import { ErrorBoundary } from 'react-error-boundary';
import { StreamingAssistantMessage } from '../models/streaming-assistant-message';
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

  if (!isStreaming) {
    return null;
  }

  // Always create a new StreamingAssistantMessage from streamMessage on every render
  const assistantMessage = StreamingAssistantMessage.fromContent(
    typeof streamMessage === 'string' ? streamMessage : '',
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the retry count when the error boundary resets
        console.log('[Streaming Assistant Display] Reset and Retry Triggered');
        useRetryEventBusStore.getState().resetRetryCount('step');
      }}
    >
      <AssistantDisplay assistantMessage={assistantMessage} isStreaming={isStreaming} />
    </ErrorBoundary>
  );
};
