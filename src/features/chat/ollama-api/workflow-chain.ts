// src/features/chat/ollama-api/workflow-chain.ts
import { ChatRequest, Ollama } from 'ollama/browser';
import { useAbortEventBusStore } from '../store/abort-eventbus-store';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useChatStore } from '../store/chat-store';
import { parseOrRepairJson } from './llm-output-fixer';
import { SYSTEM_PROMPT } from './prompts/prompts-system';
import { INTERFACE_PROMPT, STEPS_PROMPT } from './prompts/prompts-tools';
import {
  interfaceSchema,
  interfaceTool,
  stepsSchema,
  stepsTool,
  WorkflowService,
  WorkflowStep,
} from './tool-schemas/workflow-schema';

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
  const chatStore = useChatStore.getState();

  const assistantMessage = chatStore.addEmptyAssistantMessage();
  const messages = chatStore.getMessagesUntil(assistantMessage.id);

  if (messages.length > 1) {
    throw new WorkflowChainError('Workflow chain only supports one message', 'stream', undefined, {
      messageCount: messages.length,
    });
  }

  const streamResponse = createStreamResponse(ollamaUrl);
  let interfaceParsed: WorkflowStep | null = null;
  let stepsParsed: WorkflowStep[] | null = null;

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
      console.log('Processing interface response...');
      const parsed = parseOrRepairJson(interfaceResponse, interfaceSchema);
      if (!parsed) {
        throw new Error('Failed to parse interface JSON even after repair attempts');
      }

      interfaceParsed = {
        ...parsed,
        service: parsed.service as WorkflowService,
      };
      console.log('Interface successfully parsed and validated:', interfaceParsed);

      // Yield the interface as part of the stream
      yield {
        type: 'text',
        content: JSON.stringify({ interface: interfaceParsed }, null, 2),
        id: assistantMessage.id,
      };
    } catch (error) {
      console.error('Interface parsing failed:', {
        error,
        rawResponse: interfaceResponse,
      });
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
        { role: 'user', content: messages[0].content },
        { role: 'assistant', content: interfaceResponse },
      ],
      tools: [stepsTool],
      options: parameters,
      stream: true,
    });

    try {
      console.log('Processing steps response...');
      const parsedSteps = parseOrRepairJson(stepsResponse, stepsSchema);
      if (!parsedSteps) {
        throw new Error('Failed to parse steps JSON even after repair attempts');
      }

      stepsParsed = parsedSteps.map(step => ({
        ...step,
        service: step.service as WorkflowService,
      }));
      console.log('Steps successfully parsed and validated:', stepsParsed);

      // Yield the steps as part of the stream
      yield {
        type: 'text',
        content: JSON.stringify({ steps: stepsParsed }, null, 2),
        id: assistantMessage.id,
      };

      // Combine interface and steps into a complete workflow
      if (interfaceParsed && stepsParsed) {
        console.log('Creating combined workflow...');
        const combinedWorkflow = {
          interface: interfaceParsed,
          steps: stepsParsed,
        };

        // Update the assistant message with the combined workflow
        const finalContent = JSON.stringify(combinedWorkflow, null, 2);
        chatStore.updateAssistantMessage(assistantMessage.id, finalContent);
      }
    } catch (error) {
      console.error('Steps parsing failed:', {
        error,
        rawResponse: stepsResponse,
      });
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

      // Update chat store with error message
      const errorContent = JSON.stringify(
        {
          error: error.message,
          phase: error.phase,
          validationErrors:
            error instanceof WorkflowValidationError ? error.validationErrors : undefined,
        },
        null,
        2,
      );
      chatStore.updateAssistantMessage(assistantMessage.id, errorContent);

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

    useAbortEventBusStore.getState().registerAbortCallback(() => {
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
