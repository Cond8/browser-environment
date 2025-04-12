// src/lib/cond8/_core/CoreDomain/Redprints/ConduitUtils.ts
import {
  C8Error,
  CoreBlueprint,
  CoreRedprint,
  FullLifecycleBlueprint,
  LifecycleBlueprint,
  LifecyclePayload,
  RecorderEntry,
} from '@/lib/cond8/_core';
import { diff } from 'jest-diff';

export type ReadonlyState<C8 extends CoreRedprint> = {
  var: VarUtilsType<C8>;
  plain: object;
  [key: string]: unknown;
};

export type VarUtilsType<C8 extends CoreRedprint> = {
  <V>(key: PropertyKey, value?: V): V | C8;
  has: (key: PropertyKey) => boolean;
  string: (key: PropertyKey, value?: string) => string;
  number: (key: PropertyKey, value?: number) => number;
  boolean: (key: PropertyKey, value?: boolean) => boolean;
  functional: (
    key: PropertyKey,
    value?: (...args: unknown[]) => unknown,
  ) => (...args: unknown[]) => unknown;
};

export class ConduitUtils<C8 extends CoreRedprint> {
  #closed = false;
  #lastReadonly: Record<string, unknown> = {};

  constructor(readonly c8: C8) {}

  get isClosed(): boolean {
    return this.#closed;
  }

  get readonly(): ReadonlyState<C8> {
    const readonly: Record<string, unknown> = {};
    for (const [key, layer] of this._allBlueprintLayers()) {
      readonly[key] = layer.readonly;
    }
    return Object.freeze({
      var: this.var,
      get plain() {
        return readonly;
      },
      ...readonly,
    });
  }

  stringify(): string {
    const state = this.readonly;
    return JSON.stringify(state, null, 2);
  }

  diff(): string {
    const current = this.readonly;
    const result = diff(this.#lastReadonly, current);
    this.#lastReadonly = current;
    return result ?? '[No changes in diff]';
  }

  close(
    payload: LifecyclePayload<C8>,
    directorPayload: LifecyclePayload<C8>,
    error?: Error,
    recording?: RecorderEntry[],
  ): C8Error<C8> | void {
    for (const [, layer] of this._allBlueprintLayers()) {
      layer.close();
    }
    this.#closed = true;
    if (!error) return;
    return new C8Error<C8>(error, payload, directorPayload, recording);
  }

  async handleEvent(
    event: keyof FullLifecycleBlueprint<C8>,
    payload: Partial<LifecyclePayload<C8>>,
  ): Promise<void> {
    const recorder = payload.recorder;
    payload.event = event;
    const payloadCopy = { ...payload } as LifecyclePayload<C8>;
    for (const [key, layer] of this._allLifecycleBlueprintLayers()) {
      try {
        switch (event) {
          case 'onEnter':
            if (layer.onEnter) await layer.onEnter(payloadCopy, recorder);
            break;
          case 'onExit':
            if (layer.onExit) await layer.onExit(payloadCopy, recorder);
            break;

          case 'onDirectorEnter':
            if (layer.onDirectorEnter) await layer.onDirectorEnter(payloadCopy, recorder);
            break;
          case 'onDirectorExit':
            if (layer.onDirectorExit) await layer.onDirectorExit(payloadCopy, recorder);
            break;

          case 'onActorEnter':
            if (layer.onActorEnter) await layer.onActorEnter(payloadCopy, recorder);
            break;
          case 'onActorExit':
            if (layer.onActorExit) await layer.onActorExit(payloadCopy, recorder);
            break;
          case 'onActorError':
            if (layer.onActorError) await layer.onActorError(payloadCopy, recorder);
            break;

          case 'onActorAssertStart':
            if (layer.onActorAssertStart) await layer.onActorAssertStart(payloadCopy, recorder);
            break;
          case 'onActorAssertSuccess':
            if (layer.onActorAssertSuccess) await layer.onActorAssertSuccess(payloadCopy, recorder);
            break;
          case 'onActorAssertFail':
            if (layer.onActorAssertFail) await layer.onActorAssertFail(payloadCopy, recorder);
            break;

          case 'onDirectorAssertStart':
            if (layer.onDirectorAssertStart)
              await layer.onDirectorAssertStart(payloadCopy, recorder);
            break;
          case 'onDirectorAssertSuccess':
            if (layer.onDirectorAssertSuccess)
              await layer.onDirectorAssertSuccess(payloadCopy, recorder);
            break;
          case 'onDirectorAssertFail':
            if (layer.onDirectorAssertFail) await layer.onDirectorAssertFail(payloadCopy, recorder);
            break;

          default:
            console.log('Unhandled event:', key, event);
        }
      } catch (error) {
        console.error('Error handling event:', key, event);
        console.error(error);
      }
    }
  }

  // === Internal iterators ===

  private *_allBlueprintLayers(): Generator<[string, CoreBlueprint]> {
    for (const [key, value] of Object.entries(this.c8)) {
      if (value instanceof CoreBlueprint) yield [key, value];
    }
  }

  private *_allLifecycleBlueprintLayers(): Generator<[string, FullLifecycleBlueprint<C8>]> {
    for (const [key, layer] of this._allBlueprintLayers()) {
      if (layer instanceof LifecycleBlueprint && layer.isActive) {
        yield [key, layer as unknown as FullLifecycleBlueprint<C8>];
      }
    }
  }

  get var(): VarUtilsType<C8> {
    const defaultVar = <V>(key: PropertyKey, value?: V): V | C8 => {
      if (value === undefined) {
        return this.c8.locals.get(key) as V;
      }
      this.c8.locals.set(key, value);
      return this.c8;
    };

    const checkedVar =
      <V>(check: (val: unknown) => val is V, typeName: string) =>
      (key: PropertyKey, value?: V): V => {
        if (value === undefined) {
          // get something
          const current = this.c8.locals.get(key);
          if (!check(current)) {
            throw new Error(
              `Expected ${String(key)} to be a ${typeName}, but got ${typeof current}`,
            );
          }
          return current;
        }
        // set something
        if (!check(value)) {
          throw new Error(`Cannot set ${String(key)}: expected ${typeName}, got ${typeof value}`);
        }
        this.c8.locals.set(key, value);
        return value;
      };

    return Object.assign(defaultVar, {
      has: (key: PropertyKey) => this.c8.locals.has(key),
      string: checkedVar<string>((x): x is string => typeof x === 'string', 'string'),
      number: checkedVar<number>((x): x is number => typeof x === 'number', 'number'),
      boolean: checkedVar<boolean>((x): x is boolean => typeof x === 'boolean', 'boolean'),
      functional: checkedVar<(...args: unknown[]) => unknown>(
        (x): x is (...args: unknown[]) => unknown => typeof x === 'function',
        'function',
      ),
    });
  }
}
