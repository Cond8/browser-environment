import { WorkflowConduit } from '../conduits/workflow-conduit';

export const createAccumulatorActors = <C8 extends WorkflowConduit>() => {
  return {
    From: (content: string) => (c8: C8) => {
      c8.assistAcc.add(content);
      return c8;
    },
  };
};
