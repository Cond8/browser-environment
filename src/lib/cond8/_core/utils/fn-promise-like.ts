// src/lib/cond8/_core/utils/fn-promise-like.ts
export function isPromiseLike<T>(value: unknown): value is Promise<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof (value as Promise<unknown>).then === 'function'
  );
}

export type CouldPromise<T> = Promise<T> | T;
