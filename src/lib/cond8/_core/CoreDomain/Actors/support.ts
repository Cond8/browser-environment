// src/lib/cond8/_core/CoreDomain/Actors/support.ts
import { StagedActor } from '../../CoreInfra/create-actor.js';
import { createDirector } from '../../CoreInfra/create-director.js';
import { LifecyclePayload } from '../../Lifecycle/Vacuum.js';
import { Recorder } from '../../Recorder/create-recorder.js';
import { ReadonlyState } from '../Redprints/ConduitUtils.js';
import { CoreRedprint } from '../Redprints/CoreRedprint.js';

export const createSupportActors = <C8 extends CoreRedprint>() => {
  const If = (cond: (c8: ReadonlyState) => boolean) => ({
    Then: (...thenActors: StagedActor<C8>[]) => {
      const ThenActor = createDirector<C8>(
        'Conditional Then',
        cond.toString(),
      )(...thenActors).AsActor;

      const Then = (
        c8: C8,
        recorder: Recorder | undefined,
        directorPayload: LifecyclePayload<C8>,
      ): Promise<C8> => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (cond(c8.utils.readonly)) {
          return ThenActor(c8, recorder, directorPayload) as Promise<C8>;
        }
        return new Promise<C8>(resolve => resolve(c8));
      };

      const Else =
        (...elseActors: StagedActor<C8>[]) =>
        (
          c8: C8,
          recorder: Recorder | undefined,
          directorPayload: LifecyclePayload<C8>,
        ): Promise<C8> => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!cond(c8.utils.readonly)) {
            return createDirector<C8>(
              'Conditional Else',
              cond.toString(),
            )(...elseActors).AsActor(c8, recorder, directorPayload) as Promise<C8>;
          } else {
            return ThenActor(c8, recorder, directorPayload) as Promise<C8>;
          }
        };
      return Object.assign(Then, { Else });
    },
  });

  return { If };
};
