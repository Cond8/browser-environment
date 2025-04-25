import { WorkflowConduit } from '../conduits/workflow-conduit';

export const createAccumulatorActors = <C8 extends WorkflowConduit>() => {
  return {
    From: (content: string) => (c8: C8) => {
      c8.assistAcc.add(content);
      return c8;
    },
    Summurize: () => (c8: C8) => {
      const summary = c8.assistAcc.getSummary();
      c8.var('Assistant Summary', summary);
      return c8;
    },
  };
};
