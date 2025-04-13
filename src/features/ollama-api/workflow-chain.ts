// src/features/chat/ollama-api/workflow-chain.ts
import { ChatRequest, Ollama } from 'ollama/browser';
import { useAbortEventBusStore } from '../chat/store/abort-eventbus-store';
import { useAssistantConfigStore } from '../chat/store/assistant-config-store';
import { useChatStore } from '../chat/store/chat-store';
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

function createStreamResponse(url: string) {
  return async function* streamOllamaResponse(
    id: number,
    request: ChatRequest & { stream: true },
  ): AsyncGenerator<StreamYield, string, unknown> {
    console.log('[StreamResponse] Starting stream for request:', { id, request });
    request.stream = true;

    let ollamaClient;
    try {
      console.log('[StreamResponse] Creating Ollama client with URL:', url);
      ollamaClient = new Ollama({ host: url });
    } catch (error) {
      console.error('[StreamResponse] Failed to create Ollama client:', error);
      throw new WorkflowChainError(
        'Failed to connect to Ollama service',
        'stream',
        error instanceof Error ? error : undefined,
        { url },
      );
    }

    let response;
    try {
      console.log('[StreamResponse] Starting chat stream');
      response = await ollamaClient.chat(request);
    } catch (error) {
      console.error('[StreamResponse] Failed to start chat stream:', error);
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
    let chunkCount = 0;

    try {
      console.log('[StreamResponse] Starting to process chunks');
      for await (const chunk of response) {
        chunkCount++;
        console.log(`[StreamResponse] Processing chunk ${chunkCount}:`, chunk);

        if ('error' in chunk) {
          console.error('[StreamResponse] API error response:', chunk.error);
          throw new WorkflowChainError(`API error: ${chunk.error}`, 'stream', undefined, { chunk });
        }

        let chunkContent = chunk.message?.content;
        const toolCalls = chunk.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          console.log('[StreamResponse] Found tool calls:', toolCalls);
          // Assuming we want the arguments of the first tool call as the primary content
          // Adjust this logic if multiple tool calls or different handling is needed
          if (toolCalls[0].function?.arguments) {
            // Arguments are expected to be a JSON string or object, stringify if object
            const args = toolCalls[0].function.arguments;
            chunkContent = typeof args === 'string' ? args : JSON.stringify(args);
            console.log(
              '[StreamResponse] Using stringified tool call arguments as content:',
              chunkContent,
            );
          }
        }

        if (!chunkContent) {
          console.log('[StreamResponse] Empty chunk content (incl. tool calls), skipping');
          continue;
        }

        hasReceivedContent = true;
        buffer += chunkContent;
        lookbehindBuffer += chunkContent;
        const normalized = lookbehindBuffer.toLowerCase();

        if (insideJson && normalized.includes('`')) {
          console.log('[StreamResponse] End of JSON block detected');
          lookbehindBuffer = '';
          insideJson = false;
          yield { type: 'end_json', id };
        }

        yield { type: 'text', content: chunkContent, id };

        if (!insideJson && normalized.includes('```json')) {
          console.log('[StreamResponse] Start of JSON block detected');
          lookbehindBuffer = '';
          insideJson = true;
          yield { type: 'start_json', id };
        }

        if (lookbehindBuffer.length > 1000) {
          lookbehindBuffer = lookbehindBuffer.slice(-500);
        }
      }

      console.log('[StreamResponse] Stream completed', {
        chunkCount,
        hasReceivedContent,
        bufferLength: buffer.length,
        finalBuffer: buffer,
      });

      if (hasReceivedContent && buffer.trim() === '') {
        console.warn(
          '[StreamResponse] Received content but buffer is empty - might be in JSON block',
        );
      } else if (!hasReceivedContent) {
        console.error('[StreamResponse] No content received from stream');
        throw new WorkflowChainError('No content received from stream', 'stream', undefined, {
          request,
          chunkCount,
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

      console.error('[StreamResponse] Error during stream processing:', error);
      throw new WorkflowChainError(
        'Error during stream processing',
        'stream',
        error instanceof Error ? error : undefined,
        { buffer, lookbehindBuffer, chunkCount },
      );
    }

    return buffer;
  };
}

export async function* streamWorkflowChain(): AsyncGenerator<StreamYield, void, unknown> {
  console.log('[WorkflowChain] Starting workflow chain execution');
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();
  console.log('[WorkflowChain] Using model:', selectedModel, 'with parameters:', parameters);

  const chatStore = useChatStore.getState();
  const assistantMessage = chatStore.addEmptyAssistantMessage();
  console.log('[WorkflowChain] Created new assistant message with ID:', assistantMessage.id);

  const messages = chatStore.getMessagesUntil(assistantMessage.id);
  console.log('[WorkflowChain] Retrieved messages:', messages.length);

  if (messages.length > 1) {
    console.error('[WorkflowChain] Error: More than one message found');
    throw new WorkflowChainError('Only one message is supported', 'stream', undefined, {
      messageCount: messages.length,
    });
  }

  const streamResponse = createStreamResponse(ollamaUrl);
  let interfaceParsed: WorkflowStep | null = null;
  let stepsParsed: WorkflowStep[] | null = null;

  try {
    console.log('[WorkflowChain] Starting interface phase');
    const interfaceResult = yield* handleInterfacePhase(
      messages[0].content,
      assistantMessage.id,
      streamResponse,
      selectedModel,
      parameters,
    );
    interfaceParsed = interfaceResult;
    console.log('[WorkflowChain] Interface phase completed:', interfaceResult);

    console.log('[WorkflowChain] Starting steps phase');
    const stepsResult = yield* handleStepsPhase(
      messages[0].content,
      assistantMessage.id,
      interfaceResult,
      streamResponse,
      selectedModel,
      parameters,
    );
    stepsParsed = stepsResult;
    console.log('[WorkflowChain] Steps phase completed:', stepsResult);

    const combinedWorkflow = { interface: interfaceParsed, steps: stepsParsed };
    const finalContent = JSON.stringify(combinedWorkflow, null, 2);
    console.log('[WorkflowChain] Updating assistant message with final content');
    chatStore.updateAssistantMessage(assistantMessage.id, finalContent);
  } catch (error) {
    console.error('[WorkflowChain] Error in workflow chain:', error);
    const err =
      error instanceof WorkflowChainError
        ? error
        : new WorkflowChainError('Unexpected error in workflow chain', 'stream', error as Error);

    yield { type: 'error', error: err, id: assistantMessage.id };

    const errorContent = JSON.stringify(
      {
        error: err.message,
        phase: err.phase,
        validationErrors: err instanceof WorkflowValidationError ? err.validationErrors : undefined,
      },
      null,
      2,
    );
    console.error('[WorkflowChain] Error content:', errorContent);
    chatStore.updateAssistantMessage(assistantMessage.id, errorContent);

    throw err;
  }
}
