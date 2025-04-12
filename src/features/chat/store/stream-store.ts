// src/features/chat/store/stream-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { streamWorkflowChain } from '../ollama-api/workflow-chain';
import { ThreadMessage } from './chat-store';
import { useCodeStore } from './yaml-store';

interface StreamStore {
  isStreaming: boolean;
  partialAssistantMessage: ThreadMessage | null;
  abortController: AbortController | null;
  partialYaml: string | null;
  insideYaml: boolean;
  stopStreaming: () => void;
  startChain: (assistantMessage: ThreadMessage) => void;
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
    insideYaml: false,

    stopStreaming: () => {
      set(state => {
        if (state.abortController) {
          state.abortController.abort();
          state.abortController = null;
        }
        state.isStreaming = false;
        state.partialYaml = null;
        state.insideYaml = false;
      });
    },

    startChain: async (assistantMessage: ThreadMessage) => {
      const abortController = new AbortController();

      set(state => {
        state.partialAssistantMessage = { ...assistantMessage, content: '' };
        state.partialYaml = null;
        state.isStreaming = true;
        state.abortController = abortController;
        state.insideYaml = false;
      });

      try {
        for await (const chunk of streamWorkflowChain(assistantMessage, abortController)) {
          switch (chunk.type) {
            case 'text':
              get().addPartialMessage(chunk.content); // ✅ always raw model output
              if (get().insideYaml) get().appendToYaml(chunk.content); // ✅ side effect
              break;
            case 'start_yaml':
              if (!get().insideYaml) {
                set(state => {
                  state.insideYaml = true;
                  state.partialYaml = state.partialYaml || '';
                });
              }
              break;
            case 'end_yaml':
              if (get().insideYaml) {
                set(state => {
                  state.insideYaml = false;
                });
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
        set(state => {
          state.isStreaming = false;
          state.abortController = null;
          state.partialAssistantMessage = null;
          state.partialYaml = null;
          state.insideYaml = false;
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
