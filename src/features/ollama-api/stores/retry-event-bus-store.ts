// src/features/ollama-api/stores/retry-event-bus-store.ts
import { WorkflowPhase } from '@/features/ollama-api/streaming-logic/phases/types';
import { create } from 'zustand';

type RetryCallback = (phase: WorkflowPhase, reason?: string) => void;

interface RetryEventBusStore {
  retryCallbacks: Set<RetryCallback>;
  retryCounts: Map<WorkflowPhase, number>;
  maxRetries: number;

  registerRetryCallback: (callback: RetryCallback) => RetryCallback;
  unregisterRetryCallback: (callback: RetryCallback) => void;
  triggerRetry: (phase: WorkflowPhase, reason?: string) => boolean;

  resetRetryCount: (phase: WorkflowPhase) => void;
}

export const useRetryEventBusStore = create<RetryEventBusStore>()((set, get) => ({
  retryCallbacks: new Set(),
  retryCounts: new Map(),
  maxRetries: 3, // configurable

  registerRetryCallback: (callback: RetryCallback) => {
    set(state => ({
      retryCallbacks: new Set(state.retryCallbacks).add(callback),
    }));
    return callback;
  },

  unregisterRetryCallback: (callback: RetryCallback) => {
    set(state => {
      const newSet = new Set(state.retryCallbacks);
      newSet.delete(callback);
      return { retryCallbacks: newSet };
    });
  },

  triggerRetry: (phase: WorkflowPhase, reason?: string): boolean => {
    const { retryCounts, maxRetries, retryCallbacks } = get();
    const currentCount = retryCounts.get(phase) ?? 0;

    if (currentCount >= maxRetries) {
      console.warn(
        `[RetryEventBusStore] Retry denied for phase "${phase}" — max attempts reached.`,
      );
      return false;
    }

    retryCounts.set(phase, currentCount + 1);
    set({ retryCounts: new Map(retryCounts) });

    retryCallbacks.forEach(cb => cb(phase, reason));
    return true;
  },

  resetRetryCount: (phase: WorkflowPhase) => {
    const retryCounts = new Map(get().retryCounts);
    retryCounts.delete(phase);
    set({ retryCounts });
  },
}));
