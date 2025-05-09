import dedent from 'dedent';
import { WorkflowConduit } from '../conduits/workflow-conduit';

export const createPromptActors = <C8 extends WorkflowConduit>() => {
  const Add = {
    System:
      (strings: TemplateStringsArray, ...interpolations: ((c8: C8) => string)[]) =>
      (c8: C8) => {
        const result = strings.reduce((acc, str, i) => {
          const interp = i < interpolations.length ? interpolations[i](c8) : '';
          return acc + str + interp;
        }, '');
        c8.prompt.System(dedent(result));
        return c8;
      },
    User:
      (strings: TemplateStringsArray, ...interpolations: ((c8: C8) => string)[]) =>
      (c8: C8) => {
        const result = strings.reduce((acc, str, i) => {
          const interp = i < interpolations.length ? interpolations[i](c8) : '';
          return acc + str + interp;
        }, '');
        c8.prompt.User(dedent(result));
        return c8;
      },
    Assistant:
      (strings: TemplateStringsArray, ...interpolations: ((c8: C8) => string)[]) =>
      (c8: C8) => {
        const result = strings.reduce((acc, str, i) => {
          const interp = i < interpolations.length ? interpolations[i](c8) : '';
          return acc + str + interp;
        }, '');
        c8.prompt.Assistant(dedent(result));
        return c8;
      },
  };

  const Finalize = {
    Set: (setKey: string) => (c8: C8) => {
      c8.locals.set(setKey, c8.prompt.getThread());
      return c8;
    },
  };

  const Assistant = {
    from: (key: string) => (c8: C8) => {
      const message = c8.var.string(key);
      c8.prompt.Assistant(message);
      return c8;
    },
  };

  const Reset = (c8: C8) => {
    c8.prompt.Reset();
    return c8;
  };

  return { Add, Finalize, Assistant, Reset };
};
