import { OllamaMessage } from '@/features/chat/services/ollama-types.ts';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface ThreadMessage extends OllamaMessage {
  id: number;
}

export interface Thread {
  id: number;
  title: string;
  messages: ThreadMessage[];
  error: Error | null;
}

export interface ChatStore {
  currentThreadId: Thread['id'] | null;
  threads: Record<Thread['id'], Thread>;
  resetThread: () => void;
  editUserMessage: (replaceId: number, message: string) => void;
  regenerateAssistantMessage: (replaceId: number) => void;
  addUserMessage: (message: string) => void;
  updateAssistantMessage: (id: number, message: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    immer(set => ({
      currentThreadId: null,
      threads: {},

      resetThread: () => {
        set(state => {
          state.currentThreadId = null;
        });
      },

      editUserMessage: (replaceId: number, message: string) => {
        const id = Date.now();
        const userMessage: ThreadMessage = {
          id,
          role: 'user',
          content: message,
        };
        const assistantMessage: ThreadMessage = {
          id: id + 1,
          role: 'assistant',
          content: '',
        };
        set(state => {
          const thread = state.threads[state.currentThreadId!];
          const messages = thread.messages.filter(m => m.id < replaceId);
          messages.push(userMessage, assistantMessage);
          thread.messages = messages;
        });
      },

      regenerateAssistantMessage: (replaceId: number) => {
        const id = Date.now();
        const assistantMessage: ThreadMessage = {
          id,
          role: 'assistant',
          content: '',
        };

        set(state => {
          const thread = state.threads[state.currentThreadId!];
          const messages = thread.messages.filter(m => m.id < replaceId);
          messages.push(assistantMessage);
          thread.messages = messages;
        });
      },

      addUserMessage: (message: string) => {
        const id = Date.now();
        const userMessage: ThreadMessage = {
          id,
          role: 'user',
          content: message,
        };
        const assistantMessage: ThreadMessage = {
          id: id + 1,
          role: 'assistant',
          content: '',
        };
        set(state => {
          if (!state.currentThreadId) {
            state.currentThreadId = id;
            state.threads[id] = {
              id,
              title: 'New Thread',
              messages: [userMessage, assistantMessage],
              error: null,
            };
          } else {
            const thread = state.threads[state.currentThreadId];
            thread.messages.push(userMessage, assistantMessage);
          }
        });
      },

      updateAssistantMessage: (id: number, message: string) => {
        set(state => {
          if (state.currentThreadId) {
            const thread = state.threads[state.currentThreadId];
            const assistantMessage = thread.messages.find(m => m.id === id);
            if (assistantMessage) {
              assistantMessage.content = message;
            }
          }
        });
      },
    })),
    {
      name: 'chat-storage',
      partialize: state => ({
        currentThreadId: state.currentThreadId,
        threads: state.threads,
      }),
    },
  ),
);
