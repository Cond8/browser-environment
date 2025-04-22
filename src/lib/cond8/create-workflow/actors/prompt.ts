// src/lib/cond8/create-workflow/actors/prompt.ts
import { WorkflowConduit } from '../workflow-conduit';

export const createPromptActors = <C8 extends WorkflowConduit>() => {
  const System =
    (strings: TemplateStringsArray, ...interpolations: ((c8: C8) => unknown)[]) =>
    (c8: C8) => {
      const result = strings.reduce((acc, str, i) => {
        const interp = i < interpolations.length ? interpolations[i](c8) : '';
        return acc + str + interp;
      }, '');
      // do something with `result`, like:
      c8.prompt.System(result);
      return c8;
    };

  const User =
    (strings: TemplateStringsArray, ...interpolations: ((c8: C8) => unknown)[]) =>
    (c8: C8) => {
      const result = strings.reduce((acc, str, i) => {
        const interp = i < interpolations.length ? interpolations[i](c8) : '';
        return acc + str + interp;
      }, '');
      // do something with `result`, like:
      c8.prompt.User(result); // Or however your system handles prompts
      return c8;
    };

  return { System, User };
};
