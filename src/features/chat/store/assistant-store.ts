import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ModelParameters {
  temperature: number;
  topP: number;
  topK: number;
  numPredict: number;
  repeatPenalty: number;
  repeatLastN: number;
  tfsZ: number;
  mirostat: number;
  mirostatEta: number;
  mirostatTau: number;
  numCtx: number;
}

interface AssistantState {
  parameters: ModelParameters;
  selectedModel: string | null;

  setParameters: (params: Partial<ModelParameters>) => void;
  resetParameters: () => void;
  setSelectedModel: (model: string | null) => void;
}

const defaultParameters: ModelParameters = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  numPredict: 2048,
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
      parameters: { ...defaultParameters },
      selectedModel: null,

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
        parameters: {
          temperature: state.parameters.temperature,
          topP: state.parameters.topP,
          topK: state.parameters.topK,
          numPredict: state.parameters.numPredict,
          repeatPenalty: state.parameters.repeatPenalty,
          repeatLastN: state.parameters.repeatLastN,
        },
        selectedModel: state.selectedModel,
      }),
    },
  ),
);
