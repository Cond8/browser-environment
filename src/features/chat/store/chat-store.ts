// src/features/chat/store/chat-store.ts
import { OllamaMessage, OllamaToolCall } from '@/features/chat/services/ollama-types.ts';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useStreamStore } from './stream-store';

export interface ThreadMessage extends OllamaMessage {
  id: number;
  tool_calls?: OllamaToolCall[];
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
  getCurrentThread: () => Thread | null;
  setCurrentThread: (threadId: Thread['id'] | null) => void;
  resetThread: () => void;
  addUserMessage: (message: string) => void;
  addEmptyAssistantMessage: () => ThreadMessage;
  updateAssistantMessage: (id: number, message: string) => void;

  getMessagesUntil: (id: number) => ThreadMessage[];

  getRecentThreads: (limit?: number) => Thread[];
  getTimeAgo: (timestamp: number) => string;
  getAssistantMessageCount: (threadId: Thread['id']) => number;
  clearThreads: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    immer((set, get) => ({
      currentThreadId: null as Thread['id'] | null,
      threads: {} as Record<Thread['id'], Thread>,

      setCurrentThread: (threadId: Thread['id'] | null) => {
        set(state => {
          state.currentThreadId = threadId;
        });
      },

      getCurrentThread: () => {
        return get().threads[get().currentThreadId!];
      },

      resetThread: () => {
        set(state => {
          state.currentThreadId = null;
        });
      },

      addEmptyAssistantMessage: () => {
        const id = Date.now();
        const assistantMessage: ThreadMessage = {
          id,
          role: 'assistant',
          content: '',
        };
        set(state => {
          state.threads[state.currentThreadId!].messages.push(assistantMessage);
        });

        return assistantMessage;
      },

      addUserMessage: (message: string) => {
        const id = Date.now();
        const userMessage: ThreadMessage = {
          id,
          role: 'user',
          content: message,
        };
        set(state => {
          if (!state.currentThreadId) {
            state.currentThreadId = id;
            state.threads[id] = {
              id,
              title: 'New Thread',
              messages: [userMessage],
              error: null,
            };
          } else {
            const thread = state.threads[state.currentThreadId];
            thread.messages.push(userMessage);
          }
        });

        useStreamStore.getState().startChain();
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

      getRecentThreads: (limit = 5): Thread[] => {
        const threads = Object.values(useChatStore.getState().threads);
        return threads.sort((a, b) => b.id - a.id).slice(0, limit);
      },

      getTimeAgo: (timestamp: number): string => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
      },

      getAssistantMessageCount: (threadId: Thread['id']): number => {
        const thread = useChatStore.getState().threads[threadId];
        return thread
          ? thread.messages.filter((m: ThreadMessage) => m.role === 'assistant').length
          : 0;
      },

      clearThreads: () => {
        set(state => {
          state.threads = {};
          state.currentThreadId = null;
        });
      },

      getMessagesUntil: (id: number): ThreadMessage[] => {
        const thread = useChatStore.getState().threads[useChatStore.getState().currentThreadId!];
        return thread.messages.filter(m => m.id < id);
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
