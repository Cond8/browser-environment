// src/lib/cond8/_core/utils/fn-stringify.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
export const fnStringify = (anyFn?: (...args: any[]) => any) => {
  if (!anyFn) {
    return undefined;
  }
  try {
    return anyFn.toString();
  } catch {
    return '[unserializable function]';
  }
};
