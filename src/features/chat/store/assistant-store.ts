import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ModelParameters {
  // Core parameters
  temperature: number;
  topP: number;
  topK: number;
  numPredict: number;

  // Advanced parameters
  repeatPenalty: number;
  repeatLastN: number;
  tfsZ: number;
  mirostat: number;
  mirostatEta: number;
  mirostatTau: number;
  numCtx: number;
}

interface AssistantState {
  // Model parameters
  parameters: ModelParameters;

  // Actions
  setParameters: (params: Partial<ModelParameters>) => void;
  resetParameters: () => void;
}

const defaultParameters: ModelParameters = {
  // Core parameters
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  numPredict: 2048,

  // Advanced parameters
  repeatPenalty: 1.1,
  repeatLastN: 64,
  tfsZ: 1.0,
  mirostat: 0,
  mirostatEta: 0.1,
  mirostatTau: 5.0,
  numCtx: 2048,
};

export const useAssistantStore = create<AssistantState>()(
  persist(
    immer(set => ({
      parameters: defaultParameters,

      setParameters: params => {
        set(state => {
          state.parameters = {
            ...state.parameters,
            ...params,
          };
        });
      },

      resetParameters: () => {
        set(state => {
          state.parameters = defaultParameters;
        });
      },
    })),
    {
      name: 'assistant-storage',
      // Only persist the parameters
      partialize: state => ({
        parameters: state.parameters,
      }),
    },
  ),
);
