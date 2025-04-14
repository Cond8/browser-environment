// src/features/ollama-api/streaming/infra/stream-source-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { executeWorkflowChain, WorkflowChainError } from '../api/workflow-chain';
import { WorkflowStep } from '../api/workflow-step';

export interface WorkflowCollector {
  addWorkflow: (workflow: WorkflowStep) => void;
  getWorkflows: () => WorkflowStep[];
}

export interface StreamSourceState {
  isStreaming: boolean;
  setIsStreaming: (isLoading: boolean) => void;
  workflows: WorkflowStep[];

  workflowCollector: WorkflowCollector;

  startWorkflowChain: () => Promise<{
    interface?: WorkflowStep;
    steps?: WorkflowStep[];
    error?: WorkflowChainError;
  }>;
}

export const useStreamSourceStore = create<StreamSourceState>()(
  immer((set, get) => ({
    isStreaming: false,
    workflows: [],
    setIsStreaming: (isLoading: boolean) => set({ isStreaming: isLoading }),

    startWorkflowChain: async () => {
      set({ isStreaming: true });
      console.log('startWorkflowChain');

      const steps: WorkflowStep[] = [];
      for await (const step of executeWorkflowChain()) {
        steps.push(step as WorkflowStep);
      }
      return { steps };
    },

    workflowCollector: {
      addWorkflow: (workflow: WorkflowStep) =>
        set(state => ({ workflows: [...state.workflows, workflow] })),
      getWorkflows: () => get().workflows,
    },
  })),
);
