import { OllamaService } from '@/lib/ollama';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface OllamaState {
  ollamaUrl: string;
  models: string[] | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  ollamaService: OllamaService;

  setUrl: (url: string) => void;
  checkConnection: () => Promise<void>;
  fetchModels: (force?: boolean) => Promise<string[]>;
}

const CACHE_MS = 5 * 60 * 1000;

export const useOllamaStore = create<OllamaState>()(
  persist(
    immer((set, get) => ({
      ollamaUrl: 'http://localhost:11434',
      models: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      ollamaService: new OllamaService(),

      setUrl: url => {
        set(state => {
          state.ollamaUrl = url;
          state.ollamaService.updateConfig({ baseUrl: url });
        });
        get().checkConnection();
      },

      checkConnection: async () => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const isConnected = await get().ollamaService.checkConnection();

          set(state => {
            state.error = isConnected ? null : 'Failed to connect to Ollama';
            state.isLoading = false;
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
            state.isLoading = false;
          });
        }
      },

      fetchModels: async (force = false) => {
        const now = Date.now();
        const state = get();

        if (!force && state.models && state.lastFetched && now - state.lastFetched < CACHE_MS) {
          return state.models;
        }

        set(s => {
          s.isLoading = true;
          s.error = null;
        });

        try {
          const models = await state.ollamaService.listModels();

          set(s => {
            s.models = models;
            s.lastFetched = Date.now();
            s.isLoading = false;
          });

          return models;
        } catch (err) {
          set(s => {
            s.isLoading = false;
            s.error = err instanceof Error ? err.message : 'Unknown error';
          });
          throw err;
        }
      },
    })),
    {
      name: 'ollama-store',
      partialize: state => ({ ollamaUrl: state.ollamaUrl }),
    },
  ),
);
