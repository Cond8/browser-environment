import { Message } from 'ollama';
import { chatFn } from '../../../../features/ollama-api/streaming-logic/infra/create-chat';
import { useStreamSourceStore } from '../../../../features/ollama-api/streaming-logic/infra/stream-source-store';
import { WorkflowConduit } from '../conduits/workflow-conduit';

export const createChatActors = <C8 extends WorkflowConduit>() => {
  const StreamResponse = {
    From: (from: string) => async (c8: C8) => {
      const streamSource = useStreamSourceStore.getState();
      streamSource.setIsStreaming(true);
      const thread: Message[] = c8.locals.get(from) as Message[];
      const generator = chatFn({ messages: thread });
      for await (const chunk of generator) {
        streamSource.addChunk(chunk);
      }
      const doneChunk = await generator.next();
      const assistantMessage = doneChunk.value;

      c8.thread.Assistant(assistantMessage);

      streamSource.setIsStreaming(false);
      return c8;
    },
  };

  return { StreamResponse };
};
