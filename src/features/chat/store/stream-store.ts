// src/features/chat/store/stream-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { streamWorkflowChain } from '../ollama-api/workflow-chain';
import { ThreadMessage } from './chat-store';
import { useCodeStore } from './yaml-store';

interface StreamStore {
  currentMessageId: number | null;
  isStreaming: boolean;
  partialAssistantMessages: Record<number, ThreadMessage>;
  partialYamls: Record<number, string>;
  insideYamlFlags: Record<number, boolean>;
  abortControllers: Record<number, AbortController>;
  errors: Record<number, string | null>;

  setCurrentMessageId: (messageId: number | null) => void;

  setError: (messageId: number, error: string | null) => void;
  clearErrors: () => void;

  stopStreaming: (messageId: number) => void;
  startChain: () => void;

  addPartialMessage: (messageId: number, message: string) => void;
  clearPartialAssistantMessage: (messageId: number) => void;

  appendToYaml: (messageId: number, chunk: string) => void;
  setPartialYaml: (messageId: number, yaml: string) => void;
  clearYaml: (messageId: number) => void;

  commitYamlToCodeStore: (messageId: number) => void;
}

export const useStreamStore = create<StreamStore>()(
  immer((set, get) => ({
    currentMessageId: null,
    isStreaming: false,
    partialAssistantMessages: {},
    partialYamls: {},
    insideYamlFlags: {},
    abortControllers: {},
    errors: {},

    setCurrentMessageId: (messageId: number | null) =>
      set(state => {
        state.currentMessageId = messageId;
      }),

    setError: (messageId, error) =>
      set(state => {
        state.errors[messageId] = error;
      }),

    clearErrors: () =>
      set(state => {
        state.errors = {};
      }),

    stopStreaming: (messageId: number) => {
      set(state => {
        if (state.abortControllers[messageId]) {
          state.abortControllers[messageId].abort();
          delete state.abortControllers[messageId];
        }
        state.isStreaming = false;
        delete state.partialYamls[messageId];
        delete state.insideYamlFlags[messageId];
      });
    },

    startChain: async () => {
      const abortController = new AbortController();

      set(state => {
        state.currentMessageId = null;
        state.isStreaming = true;
        state.partialAssistantMessages = {};
        state.partialYamls = {};
        state.insideYamlFlags = {};
        state.abortControllers = {};
        state.errors = {};
      });

      try {
        for await (const chunk of streamWorkflowChain(abortController)) {
          get().setCurrentMessageId(chunk.id);
          switch (chunk.type) {
            case 'text':
              get().addPartialMessage(chunk.id, chunk.content);
              if (get().insideYamlFlags[chunk.id]) get().appendToYaml(chunk.id, chunk.content);
              break;
            case 'start_yaml':
              set(state => {
                state.insideYamlFlags[chunk.id] = true;
                state.partialYamls[chunk.id] ||= '';
              });
              break;
            case 'end_yaml':
              set(state => {
                state.insideYamlFlags[chunk.id] = false;
              });
              get().commitYamlToCodeStore(chunk.id);
              break;
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Streaming error:', error);
          set(state => {
            state.errors[get().currentMessageId!] = error.message || 'Unknown error occurred';
          });
        }
      } finally {
        set(state => {
          state.currentMessageId = null;
          state.isStreaming = false;
          state.partialAssistantMessages = {};
          state.partialYamls = {};
          state.insideYamlFlags = {};
          state.abortControllers = {};
        });
      }
    },

    addPartialMessage: (messageId: number, message: string) =>
      set(state => {
        if (state.partialAssistantMessages[messageId]) {
          state.partialAssistantMessages[messageId].content += message;
        }
      }),

    clearPartialAssistantMessage: (messageId: number) =>
      set(state => {
        delete state.partialAssistantMessages[messageId];
      }),

    setPartialYaml: (messageId: number, yaml: string) =>
      set(state => {
        state.partialYamls[messageId] = yaml;
      }),

    appendToYaml: (messageId: number, chunk: string) =>
      set(state => {
        if (state.partialYamls[messageId] !== undefined) {
          state.partialYamls[messageId] += chunk;
        }
      }),

    clearYaml: (messageId: number) =>
      set(state => {
        delete state.partialYamls[messageId];
      }),

    commitYamlToCodeStore: (messageId: number) => {
      const yamlToCommit = get().partialYamls[messageId];
      if (yamlToCommit !== undefined) {
        console.log('Committing YAML to CodeStore for message:', messageId, yamlToCommit);
        useCodeStore.getState().saveYaml(messageId, yamlToCommit);
      } else {
        console.log('No YAML content to commit for message:', messageId);
      }
    },
  })),
);
