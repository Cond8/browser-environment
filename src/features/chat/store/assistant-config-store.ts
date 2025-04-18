// src/features/chat/store/assistant-config-store.ts
import { Options } from 'ollama/browser';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AssistantState {
  parameters: Partial<Options>;
  selectedModel: string;
  ollamaUrl: string;

  setUrl: (url: string) => void;
  setParameters: (params: Partial<Options>) => void;
  resetParameters: () => void;
  setSelectedModel: (model: string) => void;
}

const defaultParameters: Partial<Options> = {
  temperature: 0.5,
  top_p: 0.9,
  top_k: 40,
  num_predict: 2048,
  repeat_penalty: 1.1,
  repeat_last_n: 64,
  tfs_z: 1.0,
  mirostat: 0,
  mirostat_eta: 0.1,
  mirostat_tau: 5.0,
  num_ctx: 2048,
};

export const useAssistantConfigStore = create<AssistantState>()(
  persist(
    immer(set => ({
      parameters: { ...defaultParameters },
      selectedModel: 'gpt-4-nano',
      ollamaUrl: 'https://cond8.dev/api/openai/proxy',

      setUrl: url => {
        set(state => {
          state.ollamaUrl = url;
        });
      },

      setParameters: params => {
        set(state => {
          Object.assign(state.parameters, params);
        });
      },

      resetParameters: () => {
        set(state => {
          state.parameters = { ...defaultParameters };
        });
      },

      setSelectedModel: model => {
        set(state => {
          state.selectedModel = model;
        });
      },
    })),
    {
      name: 'assistant-storage',
      partialize: state => ({
        parameters: state.parameters,
        selectedModel: state.selectedModel,
        ollamaUrl: state.ollamaUrl,
      }),
    },
  ),
);
