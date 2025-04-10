import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AssistantSettings {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  contextWindow: number;
}

interface ChatSettingsStore {
  assistantSettings: AssistantSettings;
  ollamaUrl: string;
  availableModels: {
    models: string[];
    isLoading: boolean;
    error: string | null;
  };
  setOllamaUrl: (url: string) => void;
  setOllamaSettings: (settings: Partial<AssistantSettings>) => void;
  resetOllamaSettings: () => void;
  fetchAvailableModels: (ollamaUrl: string) => Promise<void>;
}

const defaultOllamaSettings: AssistantSettings = {
  model: 'phi4-mini',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1,
  contextWindow: 2048,
};

export const useChatSettingsStore = create<ChatSettingsStore>()(
  persist(
    immer(set => ({
      assistantSettings: defaultOllamaSettings,
      ollamaUrl: 'http://localhost:11434',
      availableModels: {
        models: [],
        isLoading: false,
        error: null,
      },
      setOllamaSettings: settings =>
        set(state => {
          Object.assign(state.assistantSettings, settings);
        }),
      setOllamaUrl: url =>
        set(state => {
          state.ollamaUrl = url;
        }),
      resetOllamaSettings: () =>
        set(state => {
          state.assistantSettings = defaultOllamaSettings;
        }),
      fetchAvailableModels: async (ollamaUrl: string) => {
        set(state => {
          state.availableModels.isLoading = true;
          state.availableModels.error = null;
        });
        try {
          const response = await fetch(`${ollamaUrl}/api/tags`);
          if (!response.ok) {
            throw new Error('Failed to fetch models');
          }
          const data = await response.json();
          set(state => {
            state.availableModels.models = data.models.map((model: any) => model.name);
            state.availableModels.isLoading = false;
          });
        } catch (error) {
          set(state => {
            state.availableModels.error =
              error instanceof Error ? error.message : 'Failed to fetch models';
            state.availableModels.isLoading = false;
          });
        }
      },
    })),
    {
      name: 'chat-settings-storage',
      // Only persist the Ollama settings, not the available models
      partialize: state => ({
        ollamaSettings: state.assistantSettings,
        ollamaUrl: state.ollamaUrl,
      }),
    },
  ),
);
