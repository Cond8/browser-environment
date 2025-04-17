// src/features/chat/store/abort-eventbus-store.ts
import { useStreamSourceStore } from '@/features/ollama-api/streaming-logic/infra/stream-source-store';
import { create } from 'zustand';

type AbortCallback = () => void;

interface AbortEventBusStore {
  abortCallbacks: Set<AbortCallback>;
  registerAbortCallback: (callback: AbortCallback) => AbortCallback;
  unregisterAbortCallback: (callback: AbortCallback) => void;
  triggerAbort: () => void;
}

export const useAbortEventBusStore = create<AbortEventBusStore>()((set, get) => ({
  abortCallbacks: new Set<AbortCallback>(),

  registerAbortCallback: (callback: AbortCallback) => {
    set(state => ({
      abortCallbacks: new Set(state.abortCallbacks).add(callback),
    }));

    return callback;
  },

  unregisterAbortCallback: (callback: AbortCallback) => {
    set(state => {
      const newCallbacks = new Set(state.abortCallbacks);
      newCallbacks.delete(callback);
      return { abortCallbacks: newCallbacks };
    });
  },

  triggerAbort: () => {
    const { abortCallbacks } = get();
    abortCallbacks.forEach(callback => callback());
    useStreamSourceStore.getState().setIsStreaming(false);
  },
}));
