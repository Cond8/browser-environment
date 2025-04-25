// src/lib/cond8/create-workflow/actors/prompt.ts
import { WorkflowConduit } from '../conduits/workflow-conduit';

export const createThreadActors = <C8 extends WorkflowConduit>() => {
  const User = {
    From: (getKey: string) => (c8: C8) => {
      const content = c8.var.string(getKey);
      c8.thread.User(content);
      return c8;
    },
  };

  const Assistant = {
    From: (getKey: string) => (c8: C8) => {
      const content = c8.var.string(getKey);
      c8.thread.Assistant(content);
      return c8;
    },
  };

  return { User, Assistant };
};
