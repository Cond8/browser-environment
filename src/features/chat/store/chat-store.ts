// src/features/chat/store/chat-store.ts
import { Message, ToolCall } from 'ollama';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useStreamStore } from '../../ollama-api/store/stream-store';

export interface ThreadMessage extends Message {
  id: number;
  error?: {
    message: string;
    type: string;
    details?: {
      phase?: 'interface' | 'steps' | 'stream';
      validationErrors?: string[];
      context?: Record<string, unknown>;
    };
  };
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
  addToolCallToMessage: (id: number, toolCall: ToolCall) => void;

  setMessageError: (id: number, error: ThreadMessage['error']) => void;

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
        const currentId = get().currentThreadId;
        return currentId ? get().threads[currentId] : null;
      },

      resetThread: () => {
        set(state => {
          state.currentThreadId = null;
        });
      },

      addEmptyAssistantMessage: (): ThreadMessage => {
        const id = Date.now();
        const assistantMessage: ThreadMessage = {
          id,
          role: 'assistant',
          content: '',
          tool_calls: [],
        };
        set(state => {
          const currentId = state.currentThreadId;
          if (currentId) {
            state.threads[currentId].messages.push(assistantMessage);
          } else {
            console.error('Cannot add assistant message: No current thread selected.');
          }
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
            if (thread.messages.length === 2 && thread.title === 'New Thread') {
              thread.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            }
          }
        });

        useStreamStore.getState().startChain();
      },

      updateAssistantMessage: (id: number, message: string) => {
        set(state => {
          const currentId = state.currentThreadId;
          if (currentId) {
            const thread = state.threads[currentId];
            const assistantMessage = thread.messages.find(
              m => m.id === id && m.role === 'assistant',
            );
            if (assistantMessage) {
              assistantMessage.content = message;
            } else {
              console.warn(`Assistant message with id ${id} not found in current thread.`);
            }
          }
        });
      },

      addToolCallToMessage: (id: number, toolCall: ToolCall) => {
        set(state => {
          const currentId = state.currentThreadId;
          if (currentId) {
            const thread = state.threads[currentId];
            const message = thread.messages.find(m => m.id === id && m.role === 'assistant');
            if (message) {
              if (!message.tool_calls) {
                message.tool_calls = [];
              }
              message.tool_calls.push(toolCall);
            } else {
              console.warn(`Assistant message with id ${id} not found to add tool call.`);
            }
          }
        });
      },

      setMessageError: (id: number, error: ThreadMessage['error']) => {
        set(state => {
          const currentId = state.currentThreadId;
          if (currentId) {
            const thread = state.threads[currentId];
            const message = thread.messages.find(m => m.id === id);
            if (message) {
              message.error = error;
            } else {
              console.warn(`Message with id ${id} not found to set error.`);
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
