// src/features/ollama-api/streaming/infra/create-completion.ts
import { useAbortEventBusStore } from '@/features/chat/store/abort-eventbus-store';
import { Ollama, Options } from 'ollama';

export function createCompletion(
  ollamaUrl: string,
  model: string,
  userOptions: Partial<Options>,
): (prompt: string, options?: Partial<Options>) => AsyncGenerator<string, string, unknown> {
  const ollama = new Ollama({ host: ollamaUrl });

  return async function* (prompt: string, phaseOptions?: Partial<Options>) {
    const stream = await ollama.generate({
      model,
      prompt,
      options: { ...userOptions, ...(phaseOptions ?? {}) },
      stream: true,
    });

    let response = '';

    const abortEvent = useAbortEventBusStore.getState().registerAbortCallback(() => {
      stream.abort();
    });

    for await (const chunk of stream) {
      if (chunk.response) {
        response += chunk.response;
        yield chunk.response;
      }
    }

    useAbortEventBusStore.getState().unregisterAbortCallback(abortEvent);

    return response;
  };
}
