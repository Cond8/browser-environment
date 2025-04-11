// src/features/chat/components/_chat-runner.tsx
import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chat-store';
import { useOllamaStore } from '../store/ollama-store';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { allTools } from '../tools';

export function ChatRunner() {
  const {
    isStreaming,
    setIsStreaming,
    currentThreadId,
    threads,
    updateLastMessage,
    addMessage,
  } = useChatStore();
  const { selectedModel, parameters } = useAssistantConfigStore();
  const { client } = useOllamaStore();

  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!isStreaming || isRunningRef.current || !currentThreadId) return;

    const thread = threads.find(t => t.id === currentThreadId);
    if (!thread) return;

    const messages = thread.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    let assistantContent = '';
    isRunningRef.current = true;
    addMessage({ role: 'assistant', content: '' });

    client.chatWithTools(
      {
        model: selectedModel ?? 'default',
        messages,
        tools: allTools.map(t => t.tool),
        tool_choice: 'auto',
        options: parameters,
      },
      async (chunk) => {
        // Handle streamed content
        if ('content' in chunk && typeof chunk.content === 'string') {
          assistantContent += chunk.content;
          updateLastMessage(assistantContent);
        }

        // 🧠 Tool call support
        if (chunk.message.tool_calls) {
          for (const call of chunk.message.tool_calls) {
            const tool = allTools.find(t => t.tool.function.name === call.function.name);
            if (!tool) continue;

            try {
              const parsedArgs = JSON.parse(call.function.arguments || '{}');
              const result = tool.parser.parse(parsedArgs); // validate with Zod

              // Add the tool call to the thread
              addMessage({
                role: 'tool',
                content: JSON.stringify(result, null, 2),
              });

              // Resume the conversation with tool result
              const continuation = await client.chat({
                model: selectedModel ?? 'default',
                messages: [
                  ...messages,
                  {
                    role: 'tool',
                    name: call.function.name,
                    content: JSON.stringify(result),
                  },
                ],
                options: parameters,
              });

              if ('content' in continuation.message) {
                addMessage({
                  role: 'assistant',
                  content: continuation.message.content,
                });
              }
            } catch (err) {
              console.error('Tool call error', err);
              addMessage({
                role: 'system',
                content: `Tool execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
              });
            }

            setIsStreaming(false);
            isRunningRef.current = false;
            return;
          }
        }

        if (chunk.done) {
          setIsStreaming(false);
          isRunningRef.current = false;
        }
      },
    ).catch((err) => {
      console.error('Streaming failed:', err);
      setIsStreaming(false);
      isRunningRef.current = false;
    });
  }, [isStreaming, currentThreadId]);

  return null;
}
