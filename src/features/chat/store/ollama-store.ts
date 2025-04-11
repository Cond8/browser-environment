// src/features/chat/store/ollama-store.ts
import { createOllamaClient, OllamaClient } from '@/features/chat/services/ollama';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface OllamaState {
  ollamaUrl: string;
  models: string[] | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  setUrl: (url: string) => void;
  checkConnection: () => Promise<void>;
  fetchModels: (force?: boolean) => Promise<string[]>;

  client: OllamaClient;
}

const CACHE_MS = 5 * 60 * 1000;

export const useOllamaStore = create<OllamaState>()(
  persist(
    immer((set, get) => {
      console.log('[OllamaStore] Creating Ollama client');
      const client = createOllamaClient({ baseUrl: 'http://localhost:11434' });

      return {
        ollamaUrl: 'http://localhost:11434',
        models: null,
        isLoading: false,
        error: null,
        lastFetched: null,
        client,

        setUrl: url => {
          console.log('[OllamaStore] Setting URL:', url);
          set(state => {
            state.ollamaUrl = url;
            state.client.updateConfig({ baseUrl: url });
          });
          get().checkConnection();
        },

        checkConnection: async () => {
          console.log('[OllamaStore] Checking connection');
          set(state => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const isConnected = await get().client.checkConnection();
            console.log('[OllamaStore] Connection check result:', isConnected);

            set(state => {
              state.error = isConnected ? null : 'Failed to connect to Ollama';
              state.isLoading = false;
            });
          } catch (err) {
            console.error('[OllamaStore] Connection check failed:', err);
            set(state => {
              state.error = err instanceof Error ? err.message : 'Unknown error';
              state.isLoading = false;
            });
          }
        },

        fetchModels: async (force = false) => {
          console.log('[OllamaStore] Fetching models, force:', force);
          const now = Date.now();
          const state = get();

          if (!force && state.models && state.lastFetched && now - state.lastFetched < CACHE_MS) {
            console.log('[OllamaStore] Using cached models');
            return state.models;
          }

          set(s => {
            s.isLoading = true;
            s.error = null;
          });

          try {
            console.log('[OllamaStore] Requesting models from Ollama');
            const models = await state.client.listModels();
            console.log('[OllamaStore] Received models:', models);

            set(s => {
              s.models = models;
              s.lastFetched = Date.now();
              s.isLoading = false;
            });

            return models;
          } catch (err) {
            console.error('[OllamaStore] Failed to fetch models:', err);
            set(s => {
              s.isLoading = false;
              s.error = err instanceof Error ? err.message : 'Unknown error';
            });
            throw err;
          }
        },
      };
    }),
    {
      name: 'ollama-store',
      partialize: state => ({ ollamaUrl: state.ollamaUrl }),
    },
  ),
);
