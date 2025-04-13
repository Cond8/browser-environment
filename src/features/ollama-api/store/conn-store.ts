// src/features/ollama-api/store/conn-store.ts
import { create } from 'zustand';

import { immer } from 'zustand/middleware/immer';

export interface ConnState {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useConnStore = create<ConnState>()(
  immer(set => ({
    isLoading: false,
    setIsLoading: (isLoading: boolean) => set({ isLoading }),
  })),
);
