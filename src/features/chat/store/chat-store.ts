// src/features/chat/store/chat-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AssistantMessage,
  BaseThreadMessage,
  MessageError,
  UserMessage,
} from '../models/thread-message';

export type ThreadMessage = BaseThreadMessage;

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

  // Message management
  addMessage: (message: UserMessage | AssistantMessage) => void;
  addUserMessage: (message: string) => void;
  addAssistantMessage: (message: AssistantMessage) => void;
  setMessageError: (id: number, error: MessageError) => void;

  getAllMessages: () => ThreadMessage[];
  getMessagesUntil: (id: number) => ThreadMessage[];

  getRecentThreads: (limit?: number) => Thread[];
  getTimeAgo: (timestamp: number) => string;
  getAssistantMessageCount: (threadId: Thread['id']) => number;
  clearThreads: () => void;
}

export const isAssistantMessageInstance = (message: ThreadMessage): message is AssistantMessage => {
  return message.role === 'assistant';
};

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

      resetThread: () => {
        set(state => {
          state.currentThreadId = null;
        });
      },

      // Message management methods
      addMessage: (message: UserMessage | AssistantMessage) => {
        set(state => {
          if (!state.currentThreadId && message.role === 'user') {
            // Create a new thread if this is the first message
            state.currentThreadId = message.id;
            const userMessage = message as UserMessage;
            state.threads[message.id] = {
              id: message.id,
              title:
                userMessage.getRawContent().substring(0, 30) +
                (userMessage.getRawContent().length > 30 ? '...' : ''),
              messages: [message],
              error: null,
            };
          } else if (state.currentThreadId) {
            // Add to existing thread
            const thread = state.threads[state.currentThreadId];
            thread.messages.push(message);
          }
        });
      },

      // Legacy methods with backward compatibility
      addUserMessage: (message: string): void => {
        const userMessage = new UserMessage(message);
        get().addMessage(userMessage);
      },

      addAssistantMessage: (message: AssistantMessage): void => {
        get().addMessage(message);
      },

      setMessageError: (id: number, error: MessageError) => {
        set(state => {
          const currentId = state.currentThreadId;
          if (currentId) {
            const thread = state.threads[currentId];
            const message = thread.messages.find(m => m.id === id);
            if (message) {
              if (isAssistantMessageInstance(message)) {
                // New message class
                message.setError(error);
              } else if (message.role === 'assistant') {
                // Legacy message
                (message as AssistantMessage).error = error;
              }
            } else {
              console.warn(
                `Message with id ${id} not found or not an assistant message to set error.`,
              );
            }
          }
        });
      },

      getRecentThreads: (limit = 5): Thread[] => {
        const threads = Object.values(get().threads);
        return threads
          .sort((a, b) => {
            const lastMsgA = a.messages[a.messages.length - 1]?.id || a.id;
            const lastMsgB = b.messages[b.messages.length - 1]?.id || b.id;
            return lastMsgB - lastMsgA;
          })
          .slice(0, limit);
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

      getMessagesUntil: (id: number): ThreadMessage[] => {
        const thread = get().getCurrentThread();
        if (!thread) return [];
        const messageIndex = thread.messages.findIndex(m => m.id === id);
        if (messageIndex === -1) return thread.messages;
        return thread.messages.slice(0, messageIndex);
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
