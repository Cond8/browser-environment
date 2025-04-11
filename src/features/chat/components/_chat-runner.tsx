// src/features/chat/components/_chat-runner.tsx
import { useEffect } from 'react';
import { useChatStore } from '../store/chat-store';
import { runAssistantStream } from '../lib/stream-runner';

export function ChatRunner() {
  const { isStreaming, currentThreadId } = useChatStore();

  console.log('[ChatRunner] Component rendered:', { isStreaming, currentThreadId });

  useEffect(() => {
    console.log('[ChatRunner] Effect triggered:', { isStreaming, currentThreadId });
    
    if (!isStreaming || !currentThreadId) {
      console.log('[ChatRunner] Not starting stream:', { isStreaming, currentThreadId });
      return;
    }

    console.log('[ChatRunner] Starting assistant stream for thread:', currentThreadId);
    void runAssistantStream(currentThreadId);
  }, [isStreaming, currentThreadId]);

  return null;
}
