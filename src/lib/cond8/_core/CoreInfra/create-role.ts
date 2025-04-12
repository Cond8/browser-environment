// src/lib/cond8/_core/CoreInfra/create-role.ts
import { CoreRedprint } from '../CoreDomain/Redprints/CoreRedprint.ts';
import { LifecyclePayload } from '../Lifecycle/Vacuum.ts';
import { MetaHook } from '../Metadata/hooks.ts';
import { Recorder } from '../Recorder/create-recorder.ts';
import { CouldPromise } from '../utils/fn-promise-like.ts';
import { createActor, StagedActor } from './create-actor.ts';

export type ActorScript<C8 extends CoreRedprint> = (
  c8: C8,
  recorder?: Recorder,
) => CouldPromise<C8>;

export interface ActorScriptWithTest<C8 extends CoreRedprint> extends ActorScript<C8> {
  test(recorder: Recorder, c8Mock: C8, directorPayload: LifecyclePayload<C8>): CouldPromise<C8>;
}

export type NeedsMetadata<T extends CoreRedprint> = (
  actorName: string,
  ...metadataRest: unknown[]
) => StagedActor<T>;

export type NeedsActorsScript<T extends CoreRedprint> = (
  actorScript: ActorScript<T>,
) => StagedActor<T>;

export type NeedsActorsScriptAndMetadata<T extends CoreRedprint> = (
  actorScript: ActorScript<T>,
) => NeedsMetadata<T>;

export function createRole<T extends CoreRedprint>(actorScript: ActorScript<T>): NeedsMetadata<T>;

export function createRole<T extends CoreRedprint>(
  actorName: string,
  ...metadata: unknown[]
): NeedsActorsScript<T>;

export function createRole<T extends CoreRedprint>(
  metaHook: MetaHook,
  ...metadata: unknown[]
): NeedsActorsScriptAndMetadata<T>;

export function createRole<T extends CoreRedprint>(
  firstArg: string | MetaHook | ActorScript<T>,
  ...restArgs: unknown[]
) {
  // Case 1: When the first argument is a string (role name)
  if (typeof firstArg === 'string') {
    return (actorScript: ActorScript<T>) => {
      if (typeof actorScript !== 'function') {
        throw new Error('Expected actorScript to be a function.');
      }
      return createActor<T>(firstArg, actorScript, ...restArgs);
    };
  }

  // Case 2: When the first argument is an instance of MetaHook
  else if (firstArg instanceof MetaHook) {
    return (actorScript: ActorScript<T>) => {
      if (typeof actorScript !== 'function') {
        throw new Error('Expected actorScript to be a function.');
      }
      return (actorName: string, ...metadataRest: unknown[]) => {
        return createActor(actorName, actorScript, firstArg, ...restArgs, ...metadataRest);
      };
    };
  }

  // Case 3: When the first argument is an actor script
  else if (typeof firstArg === 'function') {
    return (actorName: string, ...metadataRest: unknown[]) => {
      return createActor<T>(actorName, firstArg, ...metadataRest);
    };
  }

  throw new Error('Invalid arguments passed to define an Actor.');
}
