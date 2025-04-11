import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { allTools } from '../tools';
import { useAssistantConfigStore } from './assistant-config-store';
import { ThreadMessage, useChatStore } from './chat-store';

interface StreamStore {
  isStreaming: boolean;
  partialAssistantMessage: ThreadMessage | null;
  abortController: AbortController | null;
  stopStreaming: () => void;
  makePartialAssistantMessage: (assistantMessage: ThreadMessage) => void;
  addPartialMessage: (message: string) => void;
  clearPartialAssistantMessage: () => void;
}

export const useStreamStore = create<StreamStore>()(
  immer((set, get) => ({
    isStreaming: false,
    partialAssistantMessage: null,
    abortController: null,

    stopStreaming: () => {
      set(state => {
        if (state.abortController) {
          state.abortController.abort();
          state.abortController = null;
        }
        state.isStreaming = false;
      });
    },

    makePartialAssistantMessage: async (assistantMessage: ThreadMessage) => {
      const abortController = new AbortController();

      set(state => {
        state.partialAssistantMessage = assistantMessage;
        state.isStreaming = true;
        state.abortController = abortController;
      });

      try {
        const { selectedModel, parameters } = useAssistantConfigStore.getState();
        const messages = useChatStore.getState().getMessagesUntil(assistantMessage.id);

        // Transform messages to match Ollama's expected format
        const transformedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          name: msg.name,
          tool_calls: msg.tool_calls?.map(call => ({
            id: call.id,
            type: 'function',
            function: {
              name: call.function.name,
              arguments:
                typeof call.function.arguments === 'string'
                  ? JSON.parse(call.function.arguments)
                  : call.function.arguments,
            },
          })),
        }));

        // Transform tools to match Ollama's expected format
        const transformedTools = allTools.map(tool => ({
          type: 'function',
          function: {
            name: tool.tool.function.name,
            description: tool.tool.function.description,
            parameters: tool.tool.function.parameters,
          },
        }));

        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel || 'phi4-mini:latest',
            messages: transformedMessages,
            // tools: transformedTools,
            options: parameters,
            stream: true,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is null');
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                set(state => {
                  if (state.partialAssistantMessage) {
                    state.partialAssistantMessage.content += parsed.message.content;
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
      } finally {
        useChatStore
          .getState()
          .updateAssistantMessage(
            assistantMessage.id,
            get().partialAssistantMessage?.content || '',
          );

        set(state => {
          state.isStreaming = false;
          state.abortController = null;
          state.partialAssistantMessage = null;
        });
      }
    },

    addPartialMessage: message =>
      set(state => {
        if (state.partialAssistantMessage) {
          state.partialAssistantMessage.content += message;
        }
      }),

    clearPartialAssistantMessage: () =>
      set(state => {
        state.partialAssistantMessage = null;
      }),
  })),
);
