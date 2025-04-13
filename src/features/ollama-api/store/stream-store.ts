// src/features/chat/store/stream-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ThreadMessage, useChatStore } from '../../chat/store/chat-store';
import {
  streamWorkflowChain,
  WorkflowChainError,
  WorkflowValidationError,
} from '../workflow-chain';

interface StreamStore {
  currentMessageId: number | null;
  isStreaming: boolean;
  partialMessages: Record<number, ThreadMessage>;
  partialJsons: Record<number, string>;
  errors: Record<
    number,
    {
      message: string;
      type: string;
      details?: {
        phase?: 'interface' | 'steps' | 'stream' | 'alignment';
        validationErrors?: string[];
        context?: Record<string, unknown>;
      } | null;
    }
  >;

  setCurrentMessageId: (messageId: number | null) => void;

  setError: (
    messageId: number,
    error: {
      message: string;
      type: string;
      details?: {
        phase?: 'interface' | 'steps' | 'stream' | 'alignment';
        validationErrors?: string[];
        context?: Record<string, unknown>;
      } | null;
    } | null,
  ) => void;
  clearErrors: () => void;

  stopStreaming: () => void;
  startWorkflowChain: () => void;

  addPartialMessage: (messageId: number, message: string) => void;
  clearPartialAssistantMessage: (messageId: number) => void;

  setPartialJson: (messageId: number, json: string) => void;
  clearJson: (messageId: number) => void;
}

export const useStreamStore = create<StreamStore>()(
  immer((set, get) => ({
    currentMessageId: null,
    isStreaming: false,
    partialMessages: {},
    partialJsons: {},
    errors: {},

    setCurrentMessageId: (messageId: number | null) =>
      set(state => {
        state.currentMessageId = messageId;
      }),

    setError: (messageId, error) =>
      set(state => {
        if (error === null) {
          delete state.errors[messageId];
        } else {
          state.errors[messageId] = error;
        }
      }),

    clearErrors: () =>
      set(state => {
        state.errors = {};
      }),

    stopStreaming: () => {
      set(state => {
        state.isStreaming = false;
        state.partialJsons = {};
        state.partialMessages = {};
      });
    },

    startWorkflowChain: async () => {
      set(state => {
        state.currentMessageId = null;
        state.isStreaming = true;
        state.partialMessages = {};
        state.partialJsons = {};
        state.errors = {};
      });

      let currentAssistantMessageId: number | null = null;

      try {
        for await (const chunk of streamWorkflowChain()) {
          if (!currentAssistantMessageId) {
            currentAssistantMessageId = chunk.id;
          }
          get().setCurrentMessageId(chunk.id);
          switch (chunk.type) {
            case 'text':
              get().addPartialMessage(chunk.id, chunk.content);
              break;
            case 'error':
              const structuredError = {
                message: chunk.error.message,
                type: chunk.error.name,
                details: {
                  phase: chunk.error.phase,
                  validationErrors:
                    chunk.error instanceof WorkflowValidationError
                      ? chunk.error.validationErrors
                      : undefined,
                  context: chunk.error.context,
                },
              };
              get().setError(chunk.id, structuredError);
              useChatStore.getState().setMessageError(chunk.id, structuredError);
              break;
          }
        }
      } catch (error: any) {
        const errorId = currentAssistantMessageId ?? get().currentMessageId;
        if (error.name !== 'AbortError' && errorId) {
          console.error('Streaming error caught in startChain:', error);
          const structuredError = {
            message: error.message || 'Unknown error occurred',
            type: error.name || 'Error',
            details:
              error instanceof WorkflowChainError
                ? {
                    phase: error.phase,
                    context: error.context,
                    validationErrors:
                      error instanceof WorkflowValidationError ? error.validationErrors : undefined,
                  }
                : undefined,
          };
          get().setError(errorId, structuredError);
          useChatStore.getState().setMessageError(errorId, structuredError);
        }
      } finally {
        set(state => {
          state.currentMessageId = null;
          state.isStreaming = false;
          state.partialMessages = {};
          state.partialJsons = {};
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

    clearJson: (messageId: number) =>
      set(state => {
        delete state.partialJsons[messageId];
      }),
  })),
);
