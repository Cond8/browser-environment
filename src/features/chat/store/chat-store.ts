import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { OllamaConnectionService, OllamaMessage } from '../services/ollama-connection-service';
import { useChatSettingsStore } from './chat-settings-store';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: number;
  status?: 'pending' | 'completed' | 'error';
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isStreaming?: boolean;
  model?: string;
  temperature?: number;
  topP?: number;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  ollamaService: OllamaConnectionService | null;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  createConversation: (title: string, model?: string, temperature?: number, topP?: number) => void;
  setCurrentConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  setStreaming: (conversationId: string, isStreaming: boolean) => void;
  updateConversationSettings: (
    conversationId: string,
    settings: { model?: string; temperature?: number; topP?: number },
  ) => void;
  sendMessage: (content: string) => Promise<void>;
  initializeOllamaService: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    immer(set => ({
      conversations: [],
      currentConversationId: null,
      ollamaService: null,

      addMessage: (conversationId, message) =>
        set(state => {
          const conversation = state.conversations.find(conv => conv.id === conversationId);
          if (conversation) {
            conversation.messages.push({
              ...message,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            });
            conversation.updatedAt = Date.now();
          }
        }),

      updateMessage: (conversationId, messageId, updates) =>
        set(state => {
          const conversation = state.conversations.find(conv => conv.id === conversationId);
          if (conversation) {
            const message = conversation.messages.find(msg => msg.id === messageId);
            if (message) {
              Object.assign(message, updates);
              conversation.updatedAt = Date.now();
            }
          }
        }),

      createConversation: (title, model, temperature, topP) =>
        set(state => {
          const newConversation: Conversation = {
            id: crypto.randomUUID(),
            title,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isStreaming: false,
            model,
            temperature,
            topP,
          };
          state.conversations.push(newConversation);
          state.currentConversationId = newConversation.id;
        }),

      setCurrentConversation: conversationId =>
        set(state => {
          state.currentConversationId = conversationId;
        }),

      deleteConversation: conversationId =>
        set(state => {
          state.conversations = state.conversations.filter(conv => conv.id !== conversationId);
          if (state.currentConversationId === conversationId) {
            state.currentConversationId = null;
          }
        }),

      setStreaming: (conversationId, isStreaming) =>
        set(state => {
          const conversation = state.conversations.find(conv => conv.id === conversationId);
          if (conversation) {
            conversation.isStreaming = isStreaming;
          }
        }),

      updateConversationSettings: (conversationId, settings) =>
        set(state => {
          const conversation = state.conversations.find(conv => conv.id === conversationId);
          if (conversation) {
            Object.assign(conversation, settings);
            conversation.updatedAt = Date.now();
          }
        }),

      initializeOllamaService: () =>
        set(state => {
          const settings = useChatSettingsStore.getState();
          state.ollamaService = new OllamaConnectionService(
            settings.ollamaUrl,
            settings.assistantSettings.model,
            {
              temperature: settings.assistantSettings.temperature,
              top_p: settings.assistantSettings.topP,
              top_k: settings.assistantSettings.topK,
              repeat_penalty: settings.assistantSettings.repeatPenalty,
            },
          );
        }),

      sendMessage: async (content: string) => {
        const state = useChatStore.getState();
        const settings = useChatSettingsStore.getState();

        if (!state.currentConversationId || !state.ollamaService) {
          throw new Error('No active conversation or Ollama service not initialized');
        }

        const conversation = state.conversations.find(
          conv => conv.id === state.currentConversationId,
        );

        if (!conversation) {
          throw new Error('Conversation not found');
        }

        // Add user message
        const userMessageId = crypto.randomUUID();
        state.addMessage(state.currentConversationId, {
          content,
          role: 'user',
          status: 'completed',
        });

        // Add assistant message placeholder
        const assistantMessageId = crypto.randomUUID();
        state.addMessage(state.currentConversationId, {
          content: '',
          role: 'assistant',
          status: 'pending',
        });

        // Convert messages to Ollama format
        const ollamaMessages: OllamaMessage[] = conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        try {
          state.setStreaming(state.currentConversationId, true);

          // Use streaming for real-time updates
          await state.ollamaService.sendMessageStream(
            ollamaMessages,
            response => {
              state.updateMessage(state.currentConversationId!, assistantMessageId, {
                content: response.message.content,
                status: 'completed',
              });
            },
            error => {
              state.updateMessage(state.currentConversationId!, assistantMessageId, {
                status: 'error',
                error: error.message,
              });
            },
          );
        } catch (error) {
          state.updateMessage(state.currentConversationId!, assistantMessageId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        } finally {
          state.setStreaming(state.currentConversationId, false);
        }
      },
    })),
    {
      name: 'chat-storage',
      partialize: state => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    },
  ),
);
