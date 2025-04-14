// src/features/vfs/store/workflow-store.ts
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface StoredWorkflow {
  id: string;
  name: string;
  content: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowState {
  workflows: Record<string, StoredWorkflow>;
  createWorkflow: (interfaceStep: WorkflowStep) => string;
  addStepsToWorkflow: (workflowId: string, steps: WorkflowStep[]) => void;
  updateWorkflow: (id: string, content: WorkflowStep[]) => void;
  deleteWorkflow: (id: string) => void;
  getWorkflow: (id: string) => StoredWorkflow | undefined;
  getAllWorkflows: () => StoredWorkflow[];
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    immer((set, get) => ({
      workflows: {} as Record<string, StoredWorkflow>,

      createWorkflow: interfaceStep => {
        const id = crypto.randomUUID() as string;
        const now = new Date();
        set(state => {
          state.workflows[id] = {
            id,
            name: interfaceStep.name,
            content: [interfaceStep],
            createdAt: now,
            updatedAt: now,
          };
        });
        return id;
      },

      addStepsToWorkflow: (workflowId, steps) => {
        set(state => {
          if (state.workflows[workflowId]) {
            state.workflows[workflowId].content.push(...steps);
            state.workflows[workflowId].updatedAt = new Date();
          }
        });
      },

      updateWorkflow: (id, content) => {
        set(state => {
          if (state.workflows[id]) {
            state.workflows[id].content = content;
            state.workflows[id].updatedAt = new Date();
          }
        });
      },

      deleteWorkflow: id => {
        set(state => {
          delete state.workflows[id];
        });
      },

      getWorkflow: id => {
        return get().workflows[id];
      },

      getAllWorkflows: () => {
        return Object.values(get().workflows);
      },
    })),
    {
      name: 'workflow-storage',
    },
  ),
);
