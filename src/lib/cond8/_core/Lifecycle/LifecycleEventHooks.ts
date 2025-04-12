// src/lib/cond8/_core/Lifecycle/LifecycleEventHooks.ts
import { CoreRedprint } from '../CoreDomain/index.ts';
import { Recorder } from '../Recorder/create-recorder.ts';
import { CouldPromise } from '../utils/fn-promise-like.ts';
import { LifecyclePayload } from './Vacuum.ts';

export abstract class FullLifecycleBlueprint<C8 extends CoreRedprint = CoreRedprint>
  implements
    OnEnterHook<C8>,
    OnExitHook<C8>,
    OnDirectorEnterHook<C8>,
    OnDirectorExitHook<C8>,
    OnActorEnterHook<C8>,
    OnActorExitHook<C8>,
    OnActorErrorHook<C8>,
    OnActorErrorHook<C8>,
    OnActorAssertStartHook<C8>,
    OnActorAssertSuccessHook<C8>,
    OnActorAssertFailHook<C8>,
    OnDirectorAssertStartHook<C8>,
    OnDirectorAssertSuccessHook<C8>,
    OnDirectorAssertFailHook<C8>
{
  onActorAssertFail(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onActorAssertStart(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onActorAssertSuccess(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onActorEnter(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onActorError(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onActorExit(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onDirectorAssertFail(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onDirectorAssertStart(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onDirectorAssertSuccess(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onDirectorEnter(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onDirectorExit(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onEnter(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
  onExit(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void> {}
}

export interface OnEnterHook<C8 extends CoreRedprint = CoreRedprint> {
  onEnter(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnExitHook<C8 extends CoreRedprint = CoreRedprint> {
  onExit(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnDirectorEnterHook<C8 extends CoreRedprint = CoreRedprint> {
  onDirectorEnter(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnDirectorExitHook<C8 extends CoreRedprint = CoreRedprint> {
  onDirectorExit(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnActorEnterHook<C8 extends CoreRedprint = CoreRedprint> {
  onActorEnter(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnActorExitHook<C8 extends CoreRedprint = CoreRedprint> {
  onActorExit(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnActorErrorHook<C8 extends CoreRedprint = CoreRedprint> {
  onActorError(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnActorAssertStartHook<C8 extends CoreRedprint = CoreRedprint> {
  onActorAssertStart(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnActorAssertSuccessHook<C8 extends CoreRedprint = CoreRedprint> {
  onActorAssertSuccess(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnActorAssertFailHook<C8 extends CoreRedprint = CoreRedprint> {
  onActorAssertFail(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnDirectorAssertStartHook<C8 extends CoreRedprint = CoreRedprint> {
  onDirectorAssertStart(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnDirectorAssertSuccessHook<C8 extends CoreRedprint = CoreRedprint> {
  onDirectorAssertSuccess(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}

export interface OnDirectorAssertFailHook<C8 extends CoreRedprint = CoreRedprint> {
  onDirectorAssertFail(payload: LifecyclePayload<C8>, recorder?: Recorder): CouldPromise<void>;
}
