import { create } from 'zustand';

type AbortCallback = () => void;

interface EventBusStore {
  abortCallbacks: Set<AbortCallback>;
  registerAbortCallback: (callback: AbortCallback) => void;
  unregisterAbortCallback: (callback: AbortCallback) => void;
  triggerAbort: () => void;
}

export const useEventBusStore = create<EventBusStore>()((set, get) => ({
  abortCallbacks: new Set<AbortCallback>(),

  registerAbortCallback: (callback: AbortCallback) => {
    set(state => ({
      abortCallbacks: new Set(state.abortCallbacks).add(callback),
    }));
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
  },
}));
