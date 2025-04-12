// src/features/chat/ollama-api/workflow-chain.ts
import { ChatRequest, Ollama } from 'ollama/browser';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useChatStore } from '../store/chat-store';
import { useEventBusStore } from '../store/eventbus-store';
import { SYSTEM_PROMPT } from './prompts/prompts-system';
import { INTERFACE_PROMPT, STEPS_PROMPT } from './prompts/prompts-tools';
import { interfaceTool, stepsTool } from './tool-schemas/workflow-schema';

export type StreamYield =
  | { type: 'text'; content: string; id: number }
  | { type: 'start_json'; id: number }
  | { type: 'end_json'; id: number };

export async function* streamWorkflowChain(): AsyncGenerator<StreamYield, void, unknown> {
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();

  const assistantMessage = useChatStore.getState().addEmptyAssistantMessage();
  const messages = useChatStore.getState().getMessagesUntil(assistantMessage.id);

  if (messages.length > 1) {
    throw new Error('Workflow chain only supports one message');
  }

  const streamResponse = createStreamResponse(ollamaUrl);

  // Phase 1: Interface Generation
  const interfaceResponse = yield* streamResponse(assistantMessage.id, {
    model: selectedModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT() + INTERFACE_PROMPT() },
      { role: 'user', content: messages[0].content },
    ],
    tools: [interfaceTool],
    options: parameters,
    stream: true,
  });

  const interfaceWithoutBlocks = interfaceResponse.replace('```json', '').replace('```', '');
  const interfaceParsed = JSON.parse(interfaceWithoutBlocks);
  useChatStore.getState().setInterface(assistantMessage.id, interfaceParsed);

  // Phase 2: Steps Generation
  const stepsResponse = yield* streamResponse(assistantMessage.id, {
    model: selectedModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT() + STEPS_PROMPT() },
      { role: 'user', content: interfaceResponse },
    ],
    tools: [stepsTool],
    options: parameters,
    stream: true,
  });

  const stepsWithoutBlocks = stepsResponse.replace('```json', '').replace('```', '');
  const stepsParsed = JSON.parse(stepsWithoutBlocks);
  useChatStore.getState().setSteps(assistantMessage.id, stepsParsed);
}

function createStreamResponse(url: string) {
  return async function* streamOllamaResponse(
    id: number,
    request: ChatRequest & { stream: true },
  ): AsyncGenerator<StreamYield, string, unknown> {
    request.stream = true;

    const ollamaClient = new Ollama({ host: url });

    const response = await ollamaClient.chat(request);

    useEventBusStore.getState().registerAbortCallback(() => {
      response.abort();
    });

    let buffer = '';
    let lookbehindBuffer = '';
    let insideJson = false;

    try {
      for await (const chunk of response) {
        if ('error' in chunk) {
          console.error('Streaming API error response:', chunk.error);
          throw new Error(`API error: ${chunk.error}`);
        }

        const content = chunk.message?.content;
        if (!content) continue;

        buffer += content;
        lookbehindBuffer += content;
        const normalized = lookbehindBuffer.toLowerCase();

        if (insideJson && normalized.includes('`')) {
          lookbehindBuffer = '';
          insideJson = false;
          yield { type: 'end_json', id };
        }

        yield { type: 'text', content, id };

        if (!insideJson && normalized.includes('```json')) {
          lookbehindBuffer = '';
          insideJson = true;
          yield { type: 'start_json', id };
        }

        if (lookbehindBuffer.length > 1000) {
          lookbehindBuffer = lookbehindBuffer.slice(-500);
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
