// src/features/ollama-api/streaming/infra/create-chat.ts
import { useAbortEventBusStore } from '@/features/chat/store/abort-eventbus-store';
import { ChatRequest, Ollama, Options } from 'ollama';

export const createChat = (ollamaUrl: string, model: string, userOptions: Partial<Options>) => {
  const ollama = new Ollama({ host: ollamaUrl });

  return async function* (
    request: Omit<ChatRequest, 'model' | 'stream'>,
  ): AsyncGenerator<string, string, unknown> {
    const stream = await ollama.chat({
      model,
      messages: request.messages,
      stream: true,
      ...(request ?? {}),
      options: { ...userOptions, ...(request.options ?? {}) },
    });

    let response = '';

    const abortEvent = useAbortEventBusStore.getState().registerAbortCallback(() => {
      stream.abort();
    });

    for await (const chunk of stream) {
      if (chunk.message) {
        response += chunk.message.content;
        yield chunk.message.content;
      }
    }

    useAbortEventBusStore.getState().unregisterAbortCallback(abortEvent);

    console.log('[createChat] Response:', response);

    return response;
  };
};
