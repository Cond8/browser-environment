import ollama from 'ollama/browser';
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

        const response = await ollama.chat({
          model: selectedModel || 'phi4-mini:latests',
          messages: transformedMessages,
          tools: transformedTools,
          options: parameters,
          stream: true,
        });

        let totalLength = 0;
        const startTime = performance.now();

        for await (const chunk of response) {
          console.log('Chunk:', chunk.message.content);
          if (chunk.message?.content) {
            totalLength += 1;
            set(state => {
              if (state.partialAssistantMessage) {
                state.partialAssistantMessage.content += chunk.message.content;
              }
            });
          }
        }

        const duration = (performance.now() - startTime) / 1000;
        console.log('Streaming complete', {
          totalLength,
          duration: `${duration.toFixed(2)}s`,
          speed: `${(totalLength / duration).toFixed(2)} chars/s`,
        });
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
