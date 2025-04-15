// src/features/chat/store/chat-store.ts
import { SLMOutput } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface UserThreadMessage {
  id: number;
  role: 'user';
  content: string;
  type: 'alignment';
}

export interface AssistantThreadMessage {
  id: number;
  role: 'assistant';
  content: string | SLMOutput;
  type: 'alignment' | 'interface' | 'step';
  error?: {
    message: string;
    type: string;
    details?: {
      phase?: 'interface' | 'step' | 'stream' | 'alignment';
      validationErrors?: string[];
      metadata?: unknown[];
    };
  };
}

export type ThreadMessage = UserThreadMessage | AssistantThreadMessage;

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

  addAlignmentMessage: (message: string) => void;
  addInterfaceMessage: (chunks: SLMOutput) => void;
  addStepMessage: (message: WorkflowStep) => void;

  setMessageError: (id: number, error: AssistantThreadMessage['error']) => void;

  getAllMessages: () => ThreadMessage[];
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

      addUserMessage: (message: string): void => {
        const id = parseInt(nanoid(10), 36);
        const userMessage: UserThreadMessage = {
          id,
          role: 'user',
          content: message,
          type: 'alignment',
        };
        set(state => {
          if (!state.currentThreadId) {
            state.currentThreadId = id;
            state.threads[id] = {
              id,
              title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
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
      },

      addAlignmentMessage: (message: string) => {
        const alignmentMessage: AssistantThreadMessage = {
          id: parseInt(nanoid(10), 36),
          role: 'assistant',
          content: message,
          type: 'alignment',
        };
        set(state => {
          const currentId = state.currentThreadId;
          if (currentId) {
            state.threads[currentId].messages.push(alignmentMessage);
          }
        });
      },

      addInterfaceMessage: (chunks: SLMOutput) => {
        set(state => {
          const currentId = state.currentThreadId;
          if (!currentId) return;

          const interfaceMessage: AssistantThreadMessage = {
            id: parseInt(nanoid(10), 36),
            role: 'assistant',
            content: chunks,
            type: 'interface',
          };

          state.threads[currentId].messages.push(interfaceMessage);
        });
      },

      addStepMessage: (message: WorkflowStep) => {
        const stepsMessage: AssistantThreadMessage = {
          id: parseInt(nanoid(10), 36),
          role: 'assistant',
          content: JSON.stringify(message, null, 2),
          type: 'step',
        };
        set(state => {
          const currentId = state.currentThreadId;
          if (currentId) {
            state.threads[currentId].messages.push(stepsMessage);
          }
        });
      },

      setMessageError: (id: number, error: AssistantThreadMessage['error']) => {
        set(state => {
          const currentId = state.currentThreadId;
          if (currentId) {
            const thread = state.threads[currentId];
            const message = thread.messages.find(m => m.id === id);
            if (message && message.role === 'assistant') {
              message.error = error;
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
