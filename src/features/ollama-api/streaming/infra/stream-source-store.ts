// src/features/ollama-api/streaming/infra/stream-source-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { executeWorkflowChain, WorkflowChainError } from '../api/workflow-chain';
import { WorkflowStep } from '../api/workflow-step';

export interface StreamSourceState {
  isStreaming: boolean;
  setIsStreaming: (isLoading: boolean) => void;
  workflows: WorkflowStep[];
  message: string;
  startWorkflowChain: () => Promise<{
    message?: string;
    error?: WorkflowChainError;
  }>;
}

export const useStreamSourceStore = create<StreamSourceState>()(
  immer(set => ({
    isStreaming: false,
    workflows: [],
    message: '',
    setIsStreaming: (isLoading: boolean) => set({ isStreaming: isLoading }),

    startWorkflowChain: async () => {
      set({ isStreaming: true });
      console.log('startWorkflowChain');

      let message = '';
      try {
        for await (const token of executeWorkflowChain()) {
          message += token;
          set(state => {
            state.message = message;
          });
        }
      } catch (error) {
        console.error('Error in workflow chain:', error);
        return { error: error as WorkflowChainError };
      } finally {
        set(state => {
          state.isStreaming = false;
        });
      }
      return { message };
    },
  })),
);
