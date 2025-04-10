import { create } from 'zustand';

export interface Workflow {
  id: string;
  dsl: string;
  createdAt: number;
  updatedAt: number;
}

interface WorkflowState {
  currentWorkflow: Workflow | null;
  currentAst: any | null;
  setCurrentWorkflow: (workflow: Workflow) => void;
  setCurrentAst: (ast: any) => void;
}

export const useWorkflowStore = create<WorkflowState>(set => ({
  currentWorkflow: null,
  currentAst: null,

  setCurrentWorkflow: workflow => set({ currentWorkflow: workflow }),
  setCurrentAst: ast => set({ currentAst: ast }),
}));
