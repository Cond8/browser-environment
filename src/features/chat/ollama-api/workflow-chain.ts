import { SYSTEM_PROMPT } from '../services/prompts-system';
import { TOOL_PROMPT_INTERFACE_PHASE, TOOL_PROMPT_STEPS_PHASE } from '../services/prompts-tools';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { ThreadMessage, useChatStore } from '../store/chat-store';

export type StreamYield =
  | { type: 'text'; content: string }
  | { type: 'start_yaml' }
  | { type: 'end_yaml' };

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
            yield { type: 'end_yaml' };
          }

          yield { type: 'text', content };

          if (!insideYaml && normalized.includes('```yaml')) {
            lookbehindBuffer = '';
            insideYaml = true;
            yield { type: 'start_yaml' };
          }

          if (lookbehindBuffer.length > 1000) {
            lookbehindBuffer = lookbehindBuffer.slice(-500);
          }
        } catch (err) {
          console.error('Error parsing chunk:', err);
        }
      }
    }
    return buffer;
  };
}

export async function* streamWorkflowChain(
  assistantMessage: ThreadMessage,
  abortController: AbortController,
): AsyncGenerator<StreamYield, void, unknown> {
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();
  const messages = useChatStore.getState().getMessagesUntil(assistantMessage.id);

  if (messages.length > 1) {
    throw new Error('Workflow chain only supports one message');
  }

  const streamResponse = createStreamResponse(ollamaUrl, abortController);

  // Phase 1: Interface Generation
  const interfaceResponse = yield* streamResponse({
    model: selectedModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT() },
      { role: 'user', content: TOOL_PROMPT_INTERFACE_PHASE(messages[0].content) },
    ],
    options: parameters,
    stream: true,
  });

  if (abortController.signal.aborted) {
    return;
  }

  useChatStore.getState().updateAssistantMessage(assistantMessage.id, interfaceResponse);
  const stepsAssistantMessage = useChatStore.getState().addEmptyAssistantMessage();

  // Phase 2: Steps Generation
  const stepsResponse = yield* streamResponse({
    model: selectedModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT() },
      { role: 'user', content: messages[0].content },
      { role: 'assistant', content: interfaceResponse },
      { role: 'user', content: TOOL_PROMPT_STEPS_PHASE() },
    ],
    options: parameters,
    stream: true,
  });

  if (abortController.signal.aborted) {
    return;
  }

  useChatStore.getState().updateAssistantMessage(stepsAssistantMessage.id, stepsResponse);
}
