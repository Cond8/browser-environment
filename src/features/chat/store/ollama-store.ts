import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { OllamaService } from '../services/ollama-sdk';

interface OllamaState {
  // Service instance
  service: OllamaService;
  ollamaUrl: string;

  // Connection state
  isConnected: boolean;
  connectionError: string | null;

  // Available models
  availableModels: string[];
  isLoadingModels: boolean;

  // Actions
  setOllamaUrl: (url: string) => void;
  setService: (config: { baseUrl?: string; defaultModel?: string }) => void;
  checkConnection: () => Promise<void>;
  fetchModels: () => Promise<void>;
  setConnectionError: (error: string | null) => void;
}

export const useOllamaStore = create<OllamaState>()(
  persist(
    immer((set, get) => ({
      service: new OllamaService(),
      ollamaUrl: 'http://localhost:11434',
      isConnected: false,
      connectionError: null,
      availableModels: [],
      isLoadingModels: false,

      setOllamaUrl: url => {
        set(state => {
          state.ollamaUrl = url;
          state.service = new OllamaService({ baseUrl: url });
        });
        // After setting new URL, check connection
        get().checkConnection();
      },

      setService: config => {
        set(state => {
          state.service = new OllamaService(config);
          if (config.baseUrl) {
            state.ollamaUrl = config.baseUrl;
          }
        });
        // After setting new service, check connection
        get().checkConnection();
      },

      checkConnection: async () => {
        try {
          const service = get().service;
          // Try to list models as a connection check
          await service.listModels();
          set(state => {
            state.isConnected = true;
            state.connectionError = null;
          });
        } catch (error) {
          set(state => {
            state.isConnected = false;
            state.connectionError =
              error instanceof Error ? error.message : 'Failed to connect to Ollama';
          });
        }
      },

      fetchModels: async () => {
        set(state => {
          state.isLoadingModels = true;
        });

        try {
          const service = get().service;
          const models = await service.listModels();
          set(state => {
            state.availableModels = models;
            state.isLoadingModels = false;
          });
        } catch (error) {
          set(state => {
            state.isLoadingModels = false;
            state.connectionError =
              error instanceof Error ? error.message : 'Failed to fetch models';
          });
        }
      },

      setConnectionError: error => {
        set(state => {
          state.connectionError = error;
          state.isConnected = error === null;
        });
      },
    })),
    {
      name: 'ollama-storage',
      // Only persist the service configuration
      partialize: state => ({
        ollamaUrl: state.ollamaUrl,
        service: {
          baseUrl: state.service.baseUrl,
          defaultModel: state.service.getDefaultModel(),
        },
      }),
    },
  ),
);
