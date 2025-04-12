// src/lib/cond8/_core/Recorder/C8ProxyHandler.ts
import { CoreBlueprint } from '../CoreDomain/index.ts';
import { RecorderEntry } from './create-recorder.ts';

export type MetadataEntry = [string, ...unknown[]];

export type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

export type MethodFunction<T, K extends keyof T> = T[K] extends (...args: unknown[]) => unknown
  ? T[K]
  : never;

export type C8LayerObserver<T extends CoreBlueprint> = Partial<{
  [K in MethodNames<T>]: (
    readonlyState: T['readonly'],
    result: ReturnType<MethodFunction<T, K>>,
    ...args: Parameters<MethodFunction<T, K>>
  ) => MetadataEntry;
}>;

export type C8ProxyHandlerFactory<T extends CoreBlueprint> = (
  observer: C8LayerObserver<T>,
  record: (...metadata: MetadataEntry) => void,
  onObserverError?: (recording: RecorderEntry[], error: Error) => void,
) => ProxyHandler<T>;

export const createC8ProxyHandler = <T extends CoreBlueprint>(
  observer: C8LayerObserver<T> = {},
  record: (...metadata: MetadataEntry) => void,
): ProxyHandler<T> => ({
  get(target: T, prop: string | symbol, receiver: unknown): unknown {
    const original = Reflect.get(target, prop, receiver);

    if (typeof original !== 'function') {
      return original;
    }

    return (...args: Parameters<MethodFunction<T, MethodNames<T>>>) => {
      const result = original.apply(target, args) as ReturnType<MethodFunction<T, keyof T>>;

      try {
        const hook = observer[prop as keyof C8LayerObserver<T>];
        if (hook) {
          const metadata = hook(target.readonly, result, ...args);
          record(...metadata);
        }
      } catch {
        console.error('Error in observer hook ------------------');
      }

      return result;
    };
  },
});
