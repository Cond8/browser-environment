import { WorkflowConduit } from '../conduits/workflow-conduit';

export const createAccumulatorActors = <C8 extends WorkflowConduit>() => {
  const From = (content: string) => (c8: C8) => {
    c8.assistAcc.add(content);
    return c8;
  };

  const Reset = (c8: C8) => {
    c8.assistAcc.clear();
    return c8;
  };

  const Finalize = {
    Set: (setKey: string) => (c8: C8) => {
      c8.var(setKey, c8.assistAcc.getAcc());
      return c8;
    },
  };

  const Summurize = {
    Into: (setKey: string) => (c8: C8) => {
      c8.var(setKey, c8.assistAcc.getAcc());
      return c8;
    },
  };

  return {
    From,
    Finalize,
    Reset,
    Summurize,
  };
};
