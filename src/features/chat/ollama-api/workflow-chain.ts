// src/features/chat/ollama-api/workflow-chain.ts
import { SYSTEM_PROMPT } from '../services/prompts-system';
import { INTERFACE_PROMPT, STEPS_PROMPT } from '../services/prompts-tools';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useChatStore } from '../store/chat-store';

export type StreamYield =
  | { type: 'text'; content: string; id: number }
  | { type: 'start_yaml'; id: number }
  | { type: 'end_yaml'; id: number };

export async function* streamWorkflowChain(
  abortController: AbortController,
): AsyncGenerator<StreamYield, void, unknown> {
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();

  const interfaceAssistantMessage = useChatStore.getState().addEmptyAssistantMessage();
  const messages = useChatStore.getState().getMessagesUntil(interfaceAssistantMessage.id);

  if (messages.length > 1) {
    throw new Error('Workflow chain only supports one message');
  }

  const streamResponse = createStreamResponse(ollamaUrl, abortController);

  // Phase 1: Interface Generation
  const interfaceResponse = yield* streamResponse({
    model: selectedModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT() },
      { role: 'user', content: INTERFACE_PROMPT(messages[0].content) },
    ],
    options: parameters,
    stream: true,
  });

  useChatStore.getState().updateAssistantMessage(interfaceAssistantMessage.id, interfaceResponse);

  if (abortController.signal.aborted) {
    return;
  }

  const stepsAssistantMessage = useChatStore.getState().addEmptyAssistantMessage();

  // Phase 2: Steps Generation
  const stepsResponse = yield* streamResponse({
    model: selectedModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT() },
      { role: 'user', content: STEPS_PROMPT(interfaceResponse) },
    ],
    options: parameters,
    stream: true,
  });

  useChatStore.getState().updateAssistantMessage(stepsAssistantMessage.id, stepsResponse);

  if (abortController.signal.aborted) {
    return;
  }
}

function createStreamResponse(url: string, abortController: AbortController) {
  return async function* streamOllamaResponse(
    body: any,
  ): AsyncGenerator<StreamYield, string, unknown> {
    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Streaming API error response:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');

    const decoder = new TextDecoder();
    let buffer = '';
    let lookbehindBuffer = '';
    let insideYaml = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const content = parsed.message?.content;
            if (!content) continue;

            buffer += content;
            lookbehindBuffer += content;
            const normalized = lookbehindBuffer.toLowerCase();

            if (insideYaml && normalized.includes('`')) {
              lookbehindBuffer = '';
              insideYaml = false;
              yield { type: 'end_yaml', id: body.id };
            }

            yield { type: 'text', content, id: body.id };

            if (!insideYaml && normalized.includes('```yaml')) {
              lookbehindBuffer = '';
              insideYaml = true;
              yield { type: 'start_yaml', id: body.id };
            }

            if (lookbehindBuffer.length > 1000) {
              lookbehindBuffer = lookbehindBuffer.slice(-500);
            }
          } catch (err) {
            console.error('Error parsing chunk:', err);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return buffer;
      }
      throw error;
    }
    return buffer;
  };
}
