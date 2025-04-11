// src/features/chat/lib/stream-runner.ts
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useChatStore } from '../store/chat-store';
import { useOllamaStore } from '../store/ollama-store';
import { SYSTEM_PROMPT } from '../store/system-prompt';
import { allTools } from '../tools';
import { handleToolCall } from './tool-executor';

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
}

export async function runAssistantStream(threadId: string) {
  console.log('[StreamRunner] Starting runAssistantStream for thread:', threadId);
  const { threads, setIsStreaming, updateLastMessage } = useChatStore.getState();

  const { client } = useOllamaStore.getState();
  const { selectedModel, parameters } = useAssistantConfigStore.getState();

  const thread = threads.find(t => t.id === threadId);
  if (!thread) {
    console.error('[StreamRunner] Thread not found:', threadId);
    throw new Error(`Thread ${threadId} not found`);
  }

  console.log('[StreamRunner] Found thread with messages:', thread.messages.length);
  const messages: OllamaMessage[] = thread.messages.map(m => ({
    role: m.role,
    content: m.content,
    ...(m.name && { name: m.name }),
  }));

  let assistantContent = '';

  try {
    console.log('[StreamRunner] Starting chat with tools:', {
      model: selectedModel,
      messageCount: messages.length,
      toolCount: allTools.length,
    });

    await client.chatWithTools(
      {
        model: selectedModel ?? 'default',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],
        tools: allTools.map(t => t.tool),
        tool_choice: 'auto',
        options: parameters,
      },
      async chunk => {
        try {
          console.log('[StreamRunner] Received chunk:', chunk);

          if ('content' in chunk && typeof chunk.content === 'string') {
            assistantContent += chunk.content;
            updateLastMessage(assistantContent);
            console.log('[StreamRunner] Updated message content:', assistantContent);
          }

          if (chunk.message?.tool_calls) {
            console.log('[StreamRunner] Processing tool calls:', chunk.message.tool_calls);
            for (const call of chunk.message.tool_calls) {
              await handleToolCall(call, messages);
            }
            return;
          }

          if (chunk.done) {
            console.log('[StreamRunner] Stream completed');
            setIsStreaming(false);
          }
        } catch (err) {
          console.error('[StreamRunner] Error processing chunk:', err);
          const message = err instanceof Error ? err.message : 'An unknown error occurred.';
          updateLastMessage(`Error: ${message}`);
          setIsStreaming(false);
        }
      },
    );
  } catch (err) {
    console.error('[StreamRunner] Error in stream:', err);
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    updateLastMessage(`Error: ${message}`);
    setIsStreaming(false);
  }
}
