import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { OllamaConnectionService } from '../services/ollama-sdk';
import { useChatSettingsStore } from './chat-settings-store';

interface OllamaConnectionState {
  ollamaService: OllamaConnectionService | null;
  isOllamaAvailable: boolean;
  ollamaError: string | null;
  initializeOllamaService: () => Promise<void>;
  checkOllamaAvailability: () => Promise<void>;
}

export const useOllamaConnectionStore = create<OllamaConnectionState>()(
  persist(
    immer(set => ({
      ollamaService: null,
      isOllamaAvailable: false,
      ollamaError: null,

      initializeOllamaService: async () => {
        const settings = useChatSettingsStore.getState();
        const ollamaService = new OllamaConnectionService(
          settings.ollamaUrl,
          settings.assistantSettings.model,
          {
            temperature: settings.assistantSettings.temperature,
            topP: settings.assistantSettings.topP,
            topK: settings.assistantSettings.topK,
            repeatPenalty: settings.assistantSettings.repeatPenalty,
            numCtx: settings.assistantSettings.contextWindow,
          },
        );

        set(state => {
          state.ollamaService = ollamaService;
        });

        await useOllamaConnectionStore.getState().checkOllamaAvailability();
      },

      checkOllamaAvailability: async () => {
        const state = useOllamaConnectionStore.getState();
        if (!state.ollamaService) return;

        try {
          const isAvailable = await state.ollamaService.checkAvailability();
          set(state => {
            state.isOllamaAvailable = isAvailable;
            state.ollamaError = isAvailable ? null : 'Ollama service is not available';
          });
        } catch (error) {
          set(state => {
            state.isOllamaAvailable = false;
            state.ollamaError =
              error instanceof Error ? error.message : 'Failed to check Ollama availability';
          });
        }
      },
    })),
    {
      name: 'ollama-connection-storage',
      partialize: state => ({
        // We don't need to persist the service instance
        isOllamaAvailable: state.isOllamaAvailable,
        ollamaError: state.ollamaError,
      }),
    },
  ),
);
