// src/features/chat/store/chat-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  name?: string; // Optional name property for tool calls
}

export interface Thread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  threads: Thread[];
  currentThreadId: string | null;
  isStreaming: boolean;

  createThread: (initialMessage?: Omit<Message, 'id' | 'timestamp'>) => string;
  deleteThread: (threadId: string) => void;
  setCurrentThread: (threadId: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  updateThreadTitle: (threadId: string, title: string) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  stopStreaming: () => void;
  beginAssistantStream: () => void;
  finalizeAssistantStream: () => void;
  getRecentThreads: (limit?: number) => Thread[];
  getTimeAgo: (timestamp: number) => string;
  getAssistantMessageCount: (threadId: string) => number;
  clearThreads: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    immer((set, get) => ({
      threads: [],
      currentThreadId: null,
      isStreaming: false,

      createThread: initialMessage => {
        console.log('[ChatStore] Creating new thread:', initialMessage);
        const newThreadId = crypto.randomUUID();
        const now = Date.now();

        const thread: Thread = {
          id: newThreadId,
          title: 'New Chat',
          messages: [],
          createdAt: now,
          updatedAt: now,
        };

        // If an initial user message is provided, add it
        if (initialMessage) {
          const msg: Message = {
            ...initialMessage,
            id: crypto.randomUUID(),
            timestamp: now,
          };

          thread.messages.push(msg);

          if (initialMessage.role === 'user') {
            thread.title =
              initialMessage.content.slice(0, 50) +
              (initialMessage.content.length > 50 ? '...' : '');
          }
        }

        set(state => {
          state.threads.push(thread);
          state.currentThreadId = newThreadId;
        });

        console.log('[ChatStore] Created thread:', thread);
        return newThreadId;
      },

      deleteThread: threadId => {
        console.log('[ChatStore] Deleting thread:', threadId);
        set(state => {
          state.threads = state.threads.filter(t => t.id !== threadId);
          if (state.currentThreadId === threadId) {
            state.currentThreadId = state.threads[0]?.id ?? null;
          }
        });
      },

      setCurrentThread: threadId => {
        console.log('[ChatStore] Setting current thread:', threadId);
        set(state => {
          state.currentThreadId = threadId;
        });
      },

      addMessage: async message => {
        console.log('[ChatStore] Adding message:', message);
        const state = get();
        let threadId = state.currentThreadId;

        // If no current thread, create one automatically
        if (!threadId) {
          console.log('[ChatStore] No current thread, creating one');
          threadId = get().createThread();
        }

        const msg: Message = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };

        set(state => {
          const thread = state.threads.find(t => t.id === threadId);
          if (thread) {
            thread.messages.push(msg);
            thread.updatedAt = Date.now();

            if (thread.messages.length === 1 && message.role === 'user') {
              thread.title =
                message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
            }

            // Automatically start streaming when a user message is added
            if (message.role === 'user') {
              state.isStreaming = true;
            }
          }
        });
        console.log('[ChatStore] Message added to thread:', threadId);
      },

      updateLastMessage: content => {
        console.log('[ChatStore] Updating last message content:', content);
        set(state => {
          const thread = state.threads.find(t => t.id === state.currentThreadId);
          if (thread) {
            const lastMessage = thread.messages[thread.messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = content;
              thread.updatedAt = Date.now();
            }
          }
        });
      },

      updateThreadTitle: (threadId, title) => {
        console.log('[ChatStore] Updating thread title:', { threadId, title });
        set(state => {
          const thread = state.threads.find(t => t.id === threadId);
          if (thread) {
            thread.title = title;
          }
        });
      },

      setIsStreaming: isStreaming => {
        console.log('[ChatStore] Setting streaming state:', isStreaming);
        set(state => {
          state.isStreaming = isStreaming;
        });
      },

      stopStreaming: () => {
        console.log('[ChatStore] Stopping streaming');
        set(state => {
          state.isStreaming = false;
        });
      },

      beginAssistantStream: () => {
        console.log('[ChatStore] Beginning assistant stream');
        set(state => {
          state.isStreaming = true;
          // Add an empty assistant message to start streaming
          const msg: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          };
          const thread = state.threads.find(t => t.id === state.currentThreadId);
          if (thread) {
            thread.messages.push(msg);
            thread.updatedAt = Date.now();
          }
        });
      },

      finalizeAssistantStream: () => {
        console.log('[ChatStore] Finalizing assistant stream');
        set(state => {
          state.isStreaming = false;
        });
      },

      getRecentThreads: (limit = 5) => {
        const state = get();
        return [...state.threads].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
      },

      getTimeAgo: (timestamp: number) => {
        const now = Date.now();
        const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays > 0) {
          return `${diffInDays}d ago`;
        } else if (diffInHours > 0) {
          return `${diffInHours}h ago`;
        } else {
          return `${diffInMinutes}m ago`;
        }
      },

      getAssistantMessageCount: (threadId: string) => {
        const state = get();
        const thread = state.threads.find(t => t.id === threadId);
        if (!thread) return 0;
        return thread.messages.filter(m => m.role === 'assistant').length;
      },

      clearThreads: () => {
        console.log('[ChatStore] Clearing all threads');
        set(state => {
          state.threads = [];
          state.currentThreadId = null;
        });
      },
    })),
    {
      name: 'chat-storage',
      partialize: state => ({
        threads: state.threads,
        currentThreadId: state.currentThreadId,
      }),
    },
  ),
);
