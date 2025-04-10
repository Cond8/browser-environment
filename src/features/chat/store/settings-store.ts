import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OllamaSettings {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  contextWindow: number;
}

interface ChatSettingsStore {
  ollamaSettings: OllamaSettings;
  setOllamaSettings: (settings: Partial<OllamaSettings>) => void;
  resetOllamaSettings: () => void;
}

const defaultOllamaSettings: OllamaSettings = {
  model: 'llama2',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1,
  contextWindow: 2048,
};

export const useChatSettingsStore = create<ChatSettingsStore>()(
  persist(
    set => ({
      ollamaSettings: defaultOllamaSettings,
      setOllamaSettings: settings =>
        set(state => ({
          ollamaSettings: { ...state.ollamaSettings, ...settings },
        })),
      resetOllamaSettings: () => set({ ollamaSettings: defaultOllamaSettings }),
    }),
    {
      name: 'chat-settings-storage',
    },
  ),
);
