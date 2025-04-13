// src/features/ollama-api/store/conn-store.ts
import { create } from 'zustand';

import { WorkflowStep } from '../tool-schemas/workflow-schema';
import { executeWorkflowChain, WorkflowChainError } from '../workflow-chain';

export interface ConnState {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  startWorkflowChain: () => Promise<{
    interface?: WorkflowStep;
    steps?: WorkflowStep[];
    error?: WorkflowChainError;
  }>;
}

export const useConnStore = create<ConnState>()(set => ({
  isLoading: false,
  setIsLoading: (isLoading: boolean) => set({ isLoading }),

  startWorkflowChain: async () => {
    set({ isLoading: true });

    console.log('startWorkflowChain');

    return executeWorkflowChain();
  },
}));
