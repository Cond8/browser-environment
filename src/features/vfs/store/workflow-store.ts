// src/features/vfs/store/workflow-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Workflow, WorkflowStep } from '../../ollama-api/tool-schemas/workflow-schema';

export interface StoredWorkflow {
  id: string;
  name: string;
  content: Workflow;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowState {
  workflows: Record<string, StoredWorkflow>;
  createWorkflow: (interfaceStep: WorkflowStep) => string;
  addStepsToWorkflow: (workflowId: string, steps: WorkflowStep[]) => void;
  updateWorkflow: (id: string, content: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  getWorkflow: (id: string) => StoredWorkflow | undefined;
  getAllWorkflows: () => StoredWorkflow[];
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    immer((set, get) => ({
      workflows: {},

      createWorkflow: interfaceStep => {
        const id = crypto.randomUUID();
        const now = new Date();
        set(state => {
          state.workflows[id] = {
            id,
            name: interfaceStep.name,
            content: {
              interface: interfaceStep,
              steps: [],
            },
            createdAt: now,
            updatedAt: now,
          };
        });
        return id;
      },

      addStepsToWorkflow: (workflowId, steps) => {
        set(state => {
          if (state.workflows[workflowId]) {
            state.workflows[workflowId].content.steps = steps;
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
