// src/features/ollama-api/streaming-logic/infra/create-chat.ts
import { registerAbortCallback, unregisterAbortCallback } from './global-eventbus';
import { useAssistantConfigStore } from '@/features/chat/store/assistant-config-store';
import { ChatRequest, Ollama } from 'ollama/browser';

export async function* chatFn(
  request: Omit<ChatRequest, 'model' | 'stream'>,
): AsyncGenerator<string, string, unknown> {
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();

  const ollama = new Ollama({ host: ollamaUrl });
  const stream = await ollama.chat({
    model: selectedModel,
    messages: request.messages,
    stream: true,
    ...(request ?? {}),
    options: { ...parameters, ...(request.options ?? {}) },
  });

  let response = '';

  const abortEvent = registerAbortCallback(() => {
    stream.abort();
  });

  for await (const chunk of stream) {
    if (chunk.message) {
      response += chunk.message.content;
      yield chunk.message.content;
    }
  }

  unregisterAbortCallback(abortEvent);

  return response;
}
