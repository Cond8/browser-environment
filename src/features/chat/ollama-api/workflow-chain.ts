// src/features/chat/ollama-api/workflow-chain.ts
import { ChatRequest, Ollama } from 'ollama/browser';
import { ZodSchema } from 'zod';
import { useAbortEventBusStore } from '../store/abort-eventbus-store';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useChatStore } from '../store/chat-store';
import { parseOrRepairJson } from './llm-output-fixer';
import { handleInterfacePhase } from './phases/interface-phase';
import { handleStepsPhase } from './phases/steps-phase';
import { WorkflowStep } from './tool-schemas/workflow-schema';

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

function parseWithSchema(response: string, schema: ZodSchema<any>, phase: 'interface' | 'steps') {
  try {
    const parsed = parseOrRepairJson(response, schema);
    if (!parsed) throw new Error('Failed even after repair');
    return parsed;
  } catch (err) {
    throw new WorkflowValidationError(
      `Failed to parse ${phase} JSON`,
      phase,
      [err instanceof Error ? err.message : 'Unknown parsing error'],
      { rawResponse: response },
    );
  }
}

function createStreamResponse(url: string) {
  return async function* streamOllamaResponse(
    id: number,
    request: ChatRequest & { stream: true },
  ): AsyncGenerator<StreamYield, string, unknown> {
    request.stream = true;

    let ollamaClient;
    try {
      ollamaClient = new Ollama({ host: url });
    } catch (error) {
      console.error('Failed to create Ollama client:', error);
      throw new WorkflowChainError(
        'Failed to connect to Ollama service',
        'stream',
        error instanceof Error ? error : undefined,
        { url },
      );
    }

    let response;
    try {
      response = await ollamaClient.chat(request);
    } catch (error) {
      console.error('Failed to start chat stream:', error);
      throw new WorkflowChainError(
        'Failed to start chat stream',
        'stream',
        error instanceof Error ? error : undefined,
        { request },
      );
    }

    useAbortEventBusStore.getState().registerAbortCallback(() => {
      console.log('[StreamResponse] Aborting response');
      response.abort();
    });

    let buffer = '';
    let lookbehindBuffer = '';
    let insideJson = false;
    let hasReceivedContent = false;

    try {
      for await (const chunk of response) {
        if ('error' in chunk) {
          console.error('Streaming API error response:', chunk.error);
          throw new WorkflowChainError(`API error: ${chunk.error}`, 'stream', undefined, { chunk });
        }

        const content = chunk.message?.content;
        if (!content) continue;

        hasReceivedContent = true;
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

      // If we received content but the buffer is empty, it might be because we're still in a JSON block
      if (hasReceivedContent && buffer.trim() === '') {
        console.warn('Received content but buffer is empty - might be in JSON block');
        // Don't throw error here, let the parsing phase handle it
      } else if (!hasReceivedContent) {
        console.error('No content received from stream');
        throw new WorkflowChainError('No content received from stream', 'stream', undefined, {
          request,
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[StreamResponse] Stream aborted by user');
        return buffer;
      }

      if (error instanceof WorkflowChainError) {
        throw error;
      }

      console.error('Error during stream processing:', error);
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

export async function* streamWorkflowChain(): AsyncGenerator<StreamYield, void, unknown> {
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();
  const chatStore = useChatStore.getState();
  const assistantMessage = chatStore.addEmptyAssistantMessage();
  const messages = chatStore.getMessagesUntil(assistantMessage.id);

  if (messages.length > 1) {
    throw new WorkflowChainError('Only one message is supported', 'stream', undefined, {
      messageCount: messages.length,
    });
  }

  const streamResponse = createStreamResponse(ollamaUrl);
  let interfaceParsed: WorkflowStep | null = null;
  let stepsParsed: WorkflowStep[] | null = null;

  try {
    const interfaceResult = yield* handleInterfacePhase(
      messages[0].content,
      assistantMessage.id,
      streamResponse,
      selectedModel,
      parameters,
    );
    interfaceParsed = interfaceResult;

    const stepsResult = yield* handleStepsPhase(
      messages[0].content,
      assistantMessage.id,
      interfaceResult,
      streamResponse,
      selectedModel,
      parameters,
    );
    stepsParsed = stepsResult;

    const combinedWorkflow = { interface: interfaceParsed, steps: stepsParsed };
    const finalContent = JSON.stringify(combinedWorkflow, null, 2);
    chatStore.updateAssistantMessage(assistantMessage.id, finalContent);
  } catch (error) {
    const err =
      error instanceof WorkflowChainError
        ? error
        : new WorkflowChainError('Unexpected error in workflow chain', 'stream', error as Error);

    yield { type: 'error', error: err, id: assistantMessage.id };

    chatStore.updateAssistantMessage(
      assistantMessage.id,
      JSON.stringify(
        {
          error: err.message,
          phase: err.phase,
          validationErrors:
            err instanceof WorkflowValidationError ? err.validationErrors : undefined,
        },
        null,
        2,
      ),
    );

    throw err;
  }
}
