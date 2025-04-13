// src/features/chat/ollama-api/workflow-chain.ts
import { ChatRequest, Ollama } from 'ollama/browser';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useChatStore } from '../store/chat-store';
import { useEventBusStore } from '../store/eventbus-store';
import { SYSTEM_PROMPT } from './prompts/prompts-system';
import { INTERFACE_PROMPT, STEPS_PROMPT } from './prompts/prompts-tools';
import { interfaceSchema, interfaceTool, stepsSchema } from './tool-schemas/workflow-schema';

export class WorkflowChainError extends Error {
  constructor(
    message: string,
    public phase: 'interface' | 'steps' | 'stream',
    public originalError?: Error,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'WorkflowChainError';
  }
}

export class WorkflowValidationError extends WorkflowChainError {
  constructor(
    message: string,
    phase: 'interface' | 'steps',
    public validationErrors: string[],
    public context?: Record<string, unknown>,
  ) {
    super(message, phase, undefined, context);
    this.name = 'WorkflowValidationError';
  }
}

export type StreamYield =
  | { type: 'text'; content: string; id: number }
  | { type: 'start_json'; id: number }
  | { type: 'end_json'; id: number }
  | { type: 'error'; error: WorkflowChainError; id: number };

export async function* streamWorkflowChain(): AsyncGenerator<StreamYield, void, unknown> {
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();

  const assistantMessage = useChatStore.getState().addEmptyAssistantMessage();
  const messages = useChatStore.getState().getMessagesUntil(assistantMessage.id);

  if (messages.length > 1) {
    throw new WorkflowChainError('Workflow chain only supports one message', 'stream', undefined, {
      messageCount: messages.length,
    });
  }

  const streamResponse = createStreamResponse(ollamaUrl);

  try {
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

    try {
      console.log('interfaceResponse', interfaceResponse);
      const interfaceWithoutBlocks = interfaceResponse.replace('```json', '').replace('```', '');
      console.log('interfaceWithoutBlocks', interfaceWithoutBlocks);
      const interfaceParsed = JSON.parse(interfaceWithoutBlocks);
      console.log('interfaceParsed', interfaceParsed);
      const interfaceParsedValidated = interfaceSchema.parse(interfaceParsed);
      console.log('interfaceParsedValidated', interfaceParsedValidated);
    } catch (error) {
      throw new WorkflowValidationError(
        'Failed to parse interface JSON',
        'interface',
        [error instanceof Error ? error.message : 'Unknown parsing error'],
        { rawResponse: interfaceResponse },
      );
    }

    // Phase 2: Steps Generation
    const stepsResponse = yield* streamResponse(assistantMessage.id, {
      model: selectedModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT() + STEPS_PROMPT() },
        { role: 'user', content: interfaceResponse },
      ],
      // tools: [stepsTool],
      options: parameters,
      stream: true,
    });

    try {
      console.log('stepsResponse', stepsResponse);
      const stepsWithoutBlocks = stepsResponse.replace('```json', '').replace('```', '');
      console.log('stepsWithoutBlocks', stepsWithoutBlocks);
      const stepsParsed = JSON.parse(stepsWithoutBlocks);
      console.log('stepsParsed', stepsParsed);
      const stepsParsedValidated = stepsSchema.parse(stepsParsed);
      console.log('stepsParsedValidated', stepsParsedValidated);
    } catch (error) {
      throw new WorkflowValidationError(
        'Failed to parse steps JSON',
        'steps',
        [error instanceof Error ? error.message : 'Unknown parsing error'],
        { rawResponse: stepsResponse },
      );
    }
  } catch (error) {
    if (error instanceof WorkflowChainError) {
      yield { type: 'error', error, id: assistantMessage.id };
      throw error;
    }
    throw new WorkflowChainError(
      'Unexpected error in workflow chain',
      'stream',
      error instanceof Error ? error : undefined,
    );
  }
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
      console.log('[StreamResponse] Aborting response');
      response.abort();
    });

    let buffer = '';
    let lookbehindBuffer = '';
    let insideJson = false;

    try {
      for await (const chunk of response) {
        if ('error' in chunk) {
          console.error('Streaming API error response:', chunk.error);
          throw new WorkflowChainError(`API error: ${chunk.error}`, 'stream', undefined, { chunk });
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
      throw new WorkflowChainError(
        'Error during stream processing',
        'stream',
        error instanceof Error ? error : undefined,
        { buffer, lookbehindBuffer },
      );
    }
    return buffer;
  };
}
