// src/features/ollama-api/streaming-logic/infra/global-eventbus.ts

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













