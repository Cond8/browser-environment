// src/features/vfs/store/vfs-store.ts
import { create } from 'zustand';

import type { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';

type VFSStore = {
  workflows: Record<string, WorkflowStep[]>; // first step is interface
  serviceCodeMap: Record<string, string>; // signature -> code

  addWorkflow: (id: string, steps: WorkflowStep[]) => void;
  addServiceImplementation: (signature: WorkflowStep, code: string) => void;
  getServiceImplementation: (signature: WorkflowStep) => string | undefined;
};

function getSignatureKey(signature: WorkflowStep): string {
  return JSON.stringify({
    module: signature.module,
    functionName: signature.functionName,
    params: Object.keys(signature.params).sort(),
    returns: Object.keys(signature.returns).sort(),
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

  addServiceImplementation: (signature, code) => {
    const key = getSignatureKey(signature);
    set(state => ({
      serviceCodeMap: {
        ...state.serviceCodeMap,
        [key]: code,
      },
    }));
  },

  getServiceImplementation: signature => {
    const key = getSignatureKey(signature);
    return get().serviceCodeMap[key];
  },
}));
