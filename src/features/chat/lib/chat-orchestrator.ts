// src/features/chat/lib/chat-orchestrator.ts
import { useChatStore } from '../store/chat-store';
import { runAssistantStream } from './stream-runner';

export async function sendUserMessage(content: string) {
  console.log('[ChatOrchestrator] Starting sendUserMessage with content:', content);
  const { createThread, addMessage, beginAssistantStream, currentThreadId } =
    useChatStore.getState();

  let threadId = currentThreadId;
  console.log('[ChatOrchestrator] Current thread ID:', threadId);

  // Create new thread if none exists
  if (!threadId) {
    console.log('[ChatOrchestrator] Creating new thread');
    threadId = createThread({ role: 'user', content });
    console.log('[ChatOrchestrator] Created new thread with ID:', threadId);
  } else {
    // Add message to existing thread
    console.log('[ChatOrchestrator] Adding message to existing thread:', threadId);
    await addMessage({ role: 'user', content });
  }

  // Start assistant stream
  console.log('[ChatOrchestrator] Starting assistant stream for thread:', threadId);
  beginAssistantStream();
  await runAssistantStream(threadId);
}

export async function sendToolResponse(threadId: string, toolName: string, content: string) {
  console.log('[ChatOrchestrator] Starting sendToolResponse:', { threadId, toolName, content });
  const { addMessage } = useChatStore.getState();

  await addMessage({
    role: 'tool',
    content,
    name: toolName,
  });

  console.log('[ChatOrchestrator] Tool response added, continuing stream for thread:', threadId);
  await runAssistantStream(threadId);
}
