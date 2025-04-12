// src/lib/cond8/_core/Recorder/create-recorder.ts
import { CoreBlueprint } from '../CoreDomain/index.ts';
import { CouldPromise, isPromiseLike } from '../utils/fn-promise-like.ts';
import { C8LayerObserver, C8ProxyHandlerFactory, createC8ProxyHandler } from './C8ProxyHandler.ts';

export interface Recorder {
  (name: string, ...metadata: unknown[]): void;
  proxyHandlers?: Record<string, ProxyHandler<CoreBlueprint>>;
  recording: RecorderEntry[];
}

export type RecorderEntry<T = unknown[]> = {
  ms: number;
  filter: string;
  metadata: T;
};

export type ProxyHandlerFactoryMap = Record<string, C8ProxyHandlerFactory<CoreBlueprint>>;

export interface ObserverEntry {
  layerType: keyof ProxyHandlerFactoryMap;
  observer: C8LayerObserver<CoreBlueprint>;
}

export type ObserverMap = Record<string, ObserverEntry>;

interface CreateRecorderParams {
  observers?: ObserverMap;
  onError?: (recording: RecorderEntry[], error: Error) => CouldPromise<void>;
}

export const createRecorder = ({ observers, onError }: CreateRecorderParams = {}): Recorder => {
  const startTime = Date.now();
  const recording: RecorderEntry[] = [];

  const record = (type: string, ...metadata: unknown[]) => {
    recording.push({
      ms: Date.now() - startTime,
      filter: type,
      metadata,
    });

    for (const item of metadata) {
      if (item instanceof Error && onError) {
        try {
          const maybePromise = onError(recording, item);
          if (isPromiseLike(maybePromise)) {
            // Handle rejections without awaiting
            maybePromise.catch(err => {
              console.error('Error in onError handler ------------------');
              console.log(recording, item, err);
            });
          }
        } catch (err) {
          console.error('Error in onError handler ------------------');
          console.log(recording, item, err);
        }
      }
    }
  };

  const proxyHandlers =
    observers === undefined
      ? undefined
      : Object.entries(observers).reduce(
          (handlers, [layerType, { observer }]) => ({
            ...handlers,
            [layerType]: createC8ProxyHandler(observer, record),
          }),
          {} as Record<string, ProxyHandler<CoreBlueprint>>,
        );

  return Object.assign(record, {
    proxyHandlers,
    recording,
  });
};
