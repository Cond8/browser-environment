// src/lib/cond8/_core/Lifecycle/Vacuum.ts
import { CoreRedprint } from '../CoreDomain/index.js';
import { MetaHook } from '../Metadata/hooks.js';
import { Recorder } from '../Recorder/create-recorder.js';
import { FullLifecycleBlueprint } from './LifecycleEventHooks.js';

export interface LifecyclePayload<C8 extends CoreRedprint = CoreRedprint> {
  event: keyof FullLifecycleBlueprint<C8>;
  isTest?: boolean;

  directorName?: string;
  actorName?: string;

  c8: C8;
  recorder?: Recorder;

  hooks?: MetaHook[];

  inputMapper?: string;
  outputMapper?: string;

  input?: unknown;
  error?: Error;
  output?: unknown;

  metadata?: unknown[];

  actorFn?: string; // fn.toString()
  assertFn?: string; // fn.toString()
}

export class Vacuum<C8 extends CoreRedprint> {
  constructor(private _collected: object) {}

  get payload(): LifecyclePayload<C8> {
    return this._collected as LifecyclePayload<C8>;
  }

  add(collection: Partial<LifecyclePayload>): LifecyclePayload<C8> {
    this._collected = {
      ...this._collected,
      ...collection,
    };
    return this.payload;
  }
}
