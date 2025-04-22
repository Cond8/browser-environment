// src/features/ollama-api/streaming-logic/infra/stream-source-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface StreamSourceState {
  isStreaming: boolean;
  setIsStreaming: (isLoading: boolean) => void;
  addChunk: (chunk: string) => void;
  message: string;
}

export const useStreamSourceStore = create<StreamSourceState>()(
  immer(set => ({
    isStreaming: false,
    message: '',
    setIsStreaming: (isLoading: boolean) => {
      set(state => {
        state.isStreaming = isLoading;
        state.message = '';
      });
    },

    addChunk: (chunk: string) =>
      set(state => {
        state.message += chunk;
      }),
  })),
);
