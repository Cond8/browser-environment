import { chatFn } from '@/features/ollama-api/streaming-logic/infra/create-chat';
import { Message } from 'ollama';
import { WorkflowConduit } from '../conduits/workflow-conduit';

export const createStreamActors = <C8 extends WorkflowConduit>() => {
  const Response = {
    From: (from: string) => ({
      Set: (setKey: string) => async (c8: C8) => {
        const thread = c8.locals.get(from) as Message[];

        const generator = chatFn({ messages: thread });
        let assistantMessage: string | undefined;
        while (true) {
          const { value, done } = await generator.next();
          if (done) {
            assistantMessage = value;
            break;
          }
          c8.stream.addChunk(value);
        }

        c8.var(setKey, assistantMessage);
        return c8;
      },
    }),
  };

  return {
    Response,
    Start: (c8: C8) => {
      c8.stream.isStreaming = true;
      return c8;
    },
    Stop: (c8: C8) => {
      c8.stream.isStreaming = false;
      return c8;
    },
  };
};
