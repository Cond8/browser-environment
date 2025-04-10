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

      setUrl: url => {
        set(state => {
          state.ollamaUrl = url;
        });
        get().checkConnection();
      },

      checkConnection: async () => {
        try {
          const res = await fetch(`${get().ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama2',
              messages: [{ role: 'user', content: 'test' }],
              stream: false,
            }),
          });
          if (!res.ok) throw new Error('Failed to connect to Ollama');
          set(state => {
            state.error = null;
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
          });
        }
      },

      fetchModels: async (force = false) => {
        const now = Date.now();
        const state = get();

        if (
          !force &&
          state.models &&
          state.lastFetched &&
          now - state.lastFetched < CACHE_MS
        ) {
          return state.models;
        }

        set(s => {
          s.isLoading = true;
          s.error = null;
        });

        try {
          const res = await fetch(`${state.ollamaUrl}/api/tags`);
          if (!res.ok) throw new Error('Failed to fetch models');
          const json = await res.json();
          const models = json.models.map((m: { name: string }) => m.name);

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
    }
  )
);
