// src/features/ollama-api/streaming-logic/infra/global-eventbus.ts

import type { WorkflowPhase } from '@/features/ollama-api/streaming-logic/phases/types';

// --- ABORT ---
export type AbortCallback = () => void;
const abortCallbacks = new Set<AbortCallback>();

export function registerAbortCallback(cb: AbortCallback): AbortCallback {
  abortCallbacks.add(cb);
  return cb;
}

export function unregisterAbortCallback(cb: AbortCallback) {
  abortCallbacks.delete(cb);
}

export function triggerAbort() {
  abortCallbacks.forEach(cb => cb());
}

// --- RETRY ---
export type RetryCallback = (phase: WorkflowPhase, reason?: string) => void;
const retryCallbacks = new Set<RetryCallback>();
const retryCounts = new Map<WorkflowPhase, number>();
let maxRetries = 3;

export function setMaxRetries(n: number) {
  maxRetries = n;
}

export function registerRetryCallback(cb: RetryCallback): RetryCallback {
  retryCallbacks.add(cb);
  return cb;
}

export function unregisterRetryCallback(cb: RetryCallback) {
  retryCallbacks.delete(cb);
}

export function triggerRetry(phase: WorkflowPhase, reason?: string): boolean {
  const current = retryCounts.get(phase) ?? 0;
  if (current >= maxRetries) {
    console.warn(`[GlobalEventBus] Retry denied for phase "${phase}" — max attempts reached.`);
    return false;
  }
  retryCounts.set(phase, current + 1);
  retryCallbacks.forEach(cb => cb(phase, reason));
  return true;
}

export function resetRetryCount(phase: WorkflowPhase) {
  retryCounts.delete(phase);
}
