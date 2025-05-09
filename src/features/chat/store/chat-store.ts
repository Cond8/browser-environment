// src/features/chat/store/chat-store.ts
import { AssistantMessage, ThreadMessage, UserMessage } from '@/features/chat/models/message';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Thread {
  id: string;
  title: string;
  messages: ThreadMessage[];
  error: Error | null;
  timestamp: number;
}

export interface ChatStore {
  currentThreadId: Thread['id'] | null;
  threads: Record<Thread['id'], Thread>;

  getCurrentThread: () => Thread | null;
  setCurrentThread: (threadId: Thread['id'] | null) => void;
  createThread: (userMessage: UserMessage) => void;
  resetThread: () => void;

  // Message management
  addThreadMessage: (message: ThreadMessage) => void;
  addUserMessage: (message: string) => void;
  addAssistantMessage: (message: string) => void;

  getAllMessages: () => ThreadMessage[];
  getMessagesUntil: (message: ThreadMessage) => ThreadMessage[];

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
        const currentId = get().currentThreadId;
        return currentId ? get().threads[currentId] : null;
      },

      createThread: (userMessage: UserMessage) => {
        const id = nanoid();
        set(state => {
          state.threads[id] = {
            id: id,
            title: userMessage.content,
            messages: [userMessage],
            error: null,
            timestamp: Date.now(),
          };
          state.currentThreadId = id;
          console.log('Created thread:', state.threads[id]);
        });
      },

      resetThread: () => {
        set(state => {
          state.currentThreadId = null;
        });
      },

      addThreadMessage: (message: ThreadMessage): void => {
        set(state => {
          state.threads[state.currentThreadId!].messages.push(message);
          console.log('Added message to thread:', message);
        });
      },

      // Legacy methods with backward compatibility
      addUserMessage: (message: string): void => {
        const userMessage: UserMessage = {
          id: nanoid(),
          role: 'user',
          content: message,
          timestamp: Date.now(),
        };

        if (!get().currentThreadId) {
          get().createThread(userMessage);
        } else {
          get().addThreadMessage(userMessage);
        }
      },

      addAssistantMessage: (message: string): void => {
        const assistantMessage: AssistantMessage = {
          id: nanoid(),
          role: 'assistant',
          content: message,
          timestamp: Date.now(),
        };
        get().addThreadMessage(assistantMessage);
      },

      getRecentThreads: (limit = 5): Thread[] => {
        const threads = Object.values(get().threads);
        return threads.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
      },

      getTimeAgo: (timestamp: number): string => {
        const now = Date.now();
        const seconds = Math.floor((now - timestamp) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
      },

      getAssistantMessageCount: (threadId: Thread['id']): number => {
        const thread = get().threads[threadId];
        return thread ? thread.messages.filter(m => m.role === 'assistant').length : 0;
      },

      clearThreads: () => {
        set(state => {
          state.threads = {};
          state.currentThreadId = null;
        });
      },

      getAllMessages: (): ThreadMessage[] => {
        const thread = get().getCurrentThread();
        if (!thread) return [];
        return thread.messages;
      },

      getMessagesUntil: (message: ThreadMessage): ThreadMessage[] => {
        const thread = get().getCurrentThread();
        if (!thread) return [];
        return thread.messages.slice(0, thread.messages.indexOf(message));
      },
    })),
    {
      name: 'chat-storage',
    },
  ),
);
