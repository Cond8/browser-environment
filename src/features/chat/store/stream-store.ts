// src/features/chat/store/stream-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { streamAssistantMessages } from '../services/stream-assistant-messages';
import { SYSTEM_PROMPT } from '../services/prompts-system';
import { useAssistantConfigStore } from './assistant-config-store';
import { ThreadMessage, useChatStore } from './chat-store';
import { useCodeStore } from './yaml-store';

interface StreamStore {
  isStreaming: boolean;
  partialAssistantMessage: ThreadMessage | null;
  abortController: AbortController | null;
  partialYaml: string | null;
  stopStreaming: () => void;
  makePartialAssistantMessage: (assistantMessage: ThreadMessage) => void;
  addPartialMessage: (message: string) => void;
  clearPartialAssistantMessage: () => void;
  appendToYaml: (chunk: string) => void;
  setPartialYaml: (yaml: string) => void;
  clearYaml: () => void;
  commitYamlToCodeStore: (messageId: number) => void;
}

export const useStreamStore = create<StreamStore>()(
  immer((set, get) => ({
    isStreaming: false,
    partialAssistantMessage: null,
    partialYaml: null,
    abortController: null,

    stopStreaming: () => {
      set(state => {
        if (state.abortController) {
          state.abortController.abort();
          state.abortController = null;
        }
        state.isStreaming = false;
        state.partialYaml = null;
      });
    },

    makePartialAssistantMessage: async (assistantMessage: ThreadMessage) => {
      const abortController = new AbortController();
      let insideYaml = false;

      set(state => {
        state.partialAssistantMessage = { ...assistantMessage, content: '' };
        state.partialYaml = null;
        state.isStreaming = true;
        state.abortController = abortController;
      });

      try {
        const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();
        const messages = useChatStore.getState().getMessagesUntil(assistantMessage.id);

        const transformedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: 'system',
                content: SYSTEM_PROMPT(),
              },
              ...transformedMessages,
            ],
            options: parameters,
            stream: true,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error('Streaming API error response:', errorBody);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        for await (const chunk of streamAssistantMessages(response)) {
          switch (chunk.type) {
            case 'text':
              get().addPartialMessage(chunk.content); // ✅ always raw model output
              if (insideYaml) get().appendToYaml(chunk.content); // ✅ side effect
              break;
            case 'start_yaml':
              if (!insideYaml) {
                insideYaml = true;
                get().setPartialYaml('');
              }
              break;
            case 'end_yaml':
              if (insideYaml) {
                insideYaml = false;
                get().commitYamlToCodeStore(assistantMessage.id);
              }
              break;
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Stream fetch aborted by user.');
        } else {
          console.error('Streaming error:', error);
          set(state => {
            if (state.partialAssistantMessage) {
              state.partialAssistantMessage.content += `

**Error during stream:** ${error.message}`;
            }
          });
        }
      } finally {
        if (!abortController.signal.aborted && get().partialAssistantMessage) {
          console.log(
            'Committing final message to ChatStore:',
            get().partialAssistantMessage?.content,
          );
          useChatStore
            .getState()
            .updateAssistantMessage(
              assistantMessage.id,
              get().partialAssistantMessage?.content || '',
            );
        } else {
          console.log('Stream was aborted or no partial message, not committing to ChatStore.');
        }
        set(state => {
          state.isStreaming = false;
          state.abortController = null;
          state.partialAssistantMessage = null;
          state.partialYaml = null;
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

    setPartialYaml: yaml =>
      set(state => {
        state.partialYaml = yaml;
      }),

    appendToYaml: chunk =>
      set(state => {
        if (state.partialYaml !== null) {
          state.partialYaml += chunk;
        }
      }),

    clearYaml: () =>
      set(state => {
        state.partialYaml = null;
      }),

    commitYamlToCodeStore: messageId => {
      const yamlToCommit = get().partialYaml;
      if (yamlToCommit !== null) {
        console.log('Committing YAML to CodeStore for message:', messageId, yamlToCommit);
        useCodeStore.getState().saveYaml(messageId, yamlToCommit);
      } else {
        console.log('No YAML content to commit for message:', messageId);
      }
    },
  })),
);
