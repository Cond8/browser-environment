// src/lib/cond8/create-workflow/actors/prompt.ts
import dedent from 'dedent';
import { WorkflowConduit } from '../conduits/workflow-conduit';

export const createThreadActors = <C8 extends WorkflowConduit>() => {
  const System =
    (strings: TemplateStringsArray, ...interpolations: ((c8: C8) => string)[]) =>
    (c8: C8) => {
      const result = strings.reduce((acc, str, i) => {
        const interp = i < interpolations.length ? interpolations[i](c8) : '';
        return acc + str + interp;
      }, '');
      c8.thread.System(dedent(result));
      return c8;
    };

  const User =
    (strings: TemplateStringsArray, ...interpolations: ((c8: C8) => string)[]) =>
    (c8: C8) => {
      const result = strings.reduce((acc, str, i) => {
        const interp = i < interpolations.length ? interpolations[i](c8) : '';
        return acc + str + interp;
      }, '');
      c8.thread.User(dedent(result));
      return c8;
    };

  const Finalize = {
    Set: (setKey: string) => (c8: C8) => {
      c8.locals.set(setKey, c8.thread.getThread());
      return c8;
    },
  };

  return { System, User, Finalize };
};
