import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  conversations: Record<string, Conversation>;
  currentConversationId: string | null;
  isLoading: boolean;
  setCurrentConversation: (id: string) => void;
  createConversation: () => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
}

export const useChatStore = create<ChatState>(set => ({
  conversations: {},
  currentConversationId: null,
  isLoading: false,

  setCurrentConversation: id => set({ currentConversationId: id }),

  createConversation: () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set(state => ({
      conversations: {
        ...state.conversations,
        [newConversation.id]: newConversation,
      },
      currentConversationId: newConversation.id,
    }));
  },

  deleteConversation: id => {
    set(state => {
      const { [id]: _, ...remaining } = state.conversations;
      return {
        conversations: remaining,
        currentConversationId:
          state.currentConversationId === id ? null : state.currentConversationId,
      };
    });
  },

  addMessage: (conversationId, message) => {
    set(state => {
      const conversation = state.conversations[conversationId];
      if (!conversation) return state;

      return {
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...conversation,
            messages: [...conversation.messages, message],
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  updateMessage: (conversationId, messageId, content) => {
    set(state => {
      const conversation = state.conversations[conversationId];
      if (!conversation) return state;

      return {
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...conversation,
            messages: conversation.messages.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg,
            ),
            updatedAt: Date.now(),
          },
        },
      };
    });
  },
}));
