// src/features/vfs/store/vfs-store.ts
import { create } from 'zustand';

import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';

type VFSStore = {
  workflows: Record<string, WorkflowStep[]>; // first step is interface
  serviceCodeMap: Record<string, string>;    // identity -> code

  addWorkflow: (id: string, steps: WorkflowStep[]) => void;
  addServiceImplementation: (
      identity: Omit<WorkflowStep, 'goal'>,
      code: string
  ) => void;
  getServiceImplementation: (
      identity: Omit<WorkflowStep, 'goal'>
  ) => string | undefined;
};

function getIdentityKey(identity: Omit<WorkflowStep, 'goal'>): string {
  return JSON.stringify({
    module: identity.module,
    functionName: identity.functionName,
    params: Object.keys(identity.params).sort(),
    returns: Object.keys(identity.returns).sort(),
  });
}

export const useVFSStore = create<VFSStore>((set, get) => ({
  workflows: {},
  serviceCodeMap: {},

  addWorkflow: (id, steps) => {
    set(state => ({
      workflows: {
        ...state.workflows,
        [id]: steps,
      },
    }));
  },

  addServiceImplementation: (identity, code) => {
    const key = getIdentityKey(identity);
    set(state => ({
      serviceCodeMap: {
        ...state.serviceCodeMap,
        [key]: code,
      },
    }));
  },

  getServiceImplementation: (identity) => {
    const key = getIdentityKey(identity);
    return get().serviceCodeMap[key];
  },
}));
