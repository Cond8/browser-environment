// src/features/chat/store/stream-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { streamWorkflowChain } from '../ollama-api/workflow-chain';
import { ThreadMessage } from './chat-store';
import { useCodeStore } from './json-store';

interface StreamStore {
  currentMessageId: number | null;
  isStreaming: boolean;
  insideJson: boolean;
  partialMessages: Record<number, ThreadMessage>;
  partialJsons: Record<number, string>;
  errors: Record<number, string | null>;

  setCurrentMessageId: (messageId: number | null) => void;

  setError: (messageId: number, error: string | null) => void;
  clearErrors: () => void;

  stopStreaming: () => void;
  startChain: () => void;

  addPartialMessage: (messageId: number, message: string) => void;
  clearPartialAssistantMessage: (messageId: number) => void;

  appendToJson: (messageId: number, chunk: string) => void;
  setPartialJson: (messageId: number, json: string) => void;
  clearJson: (messageId: number) => void;

  commitJsonToCodeStore: (messageId: number) => void;
}

export const useStreamStore = create<StreamStore>()(
  immer((set, get) => ({
    currentMessageId: null,
    isStreaming: false,
    insideJson: false,
    partialMessages: {},
    partialJsons: {},
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

    stopStreaming: () => {
      set(state => {
        state.isStreaming = false;
        state.insideJson = false;
        state.partialJsons = {};
        state.partialMessages = {};
      });
    },

    startChain: async () => {
      set(state => {
        state.currentMessageId = null;
        state.isStreaming = true;
        state.partialMessages = {};
        state.partialJsons = {};
        state.insideJson = false;
        state.errors = {};
      });

      try {
        for await (const chunk of streamWorkflowChain()) {
          get().setCurrentMessageId(chunk.id);
          switch (chunk.type) {
            case 'text':
              get().addPartialMessage(chunk.id, chunk.content);
              if (get().insideJson) get().appendToJson(chunk.id, chunk.content);
              break;
            case 'start_json':
              set(state => {
                state.insideJson = true;
                state.partialJsons[chunk.id] ||= '';
              });
              break;
            case 'end_json':
              set(state => {
                state.insideJson = false;
              });
              get().commitJsonToCodeStore(chunk.id);
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
          state.partialMessages = {};
          state.partialJsons = {};
          state.insideJson = false;
        });
      }
    },

    addPartialMessage: (messageId: number, message: string) =>
      set(state => {
        if (state.partialMessages[messageId]) {
          state.partialMessages[messageId].content += message;
        }
      }),

    clearPartialAssistantMessage: (messageId: number) =>
      set(state => {
        delete state.partialMessages[messageId];
      }),

    setPartialJson: (messageId: number, json: string) =>
      set(state => {
        state.partialJsons[messageId] = json;
      }),

    appendToJson: (messageId: number, chunk: string) =>
      set(state => {
        if (state.partialJsons[messageId] !== undefined) {
          state.partialJsons[messageId] += chunk;
        }
      }),

    clearJson: (messageId: number) =>
      set(state => {
        delete state.partialJsons[messageId];
      }),

    commitJsonToCodeStore: (messageId: number) => {
      const jsonToCommit = get().partialJsons[messageId];
      if (jsonToCommit !== undefined) {
        console.log('Committing JSON to CodeStore for message:', messageId, jsonToCommit);
        useCodeStore.getState().saveJson(messageId, jsonToCommit);
      } else {
        console.log('No JSON content to commit for message:', messageId);
      }
    },
  })),
);
