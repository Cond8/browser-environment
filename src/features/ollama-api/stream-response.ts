import { ChatRequest, Ollama } from 'ollama/browser';
import { WorkflowChainError } from './workflow-chain';

export type StreamResponseFn = (
  id: number,
  request: Omit<ChatRequest, 'model' | 'options'> & { stream: true },
) => AsyncGenerator<StreamYield, string, unknown>;

export type StreamYield =
  | { type: 'text'; content: string; id: number }
  | { type: 'error'; error: WorkflowChainError; id: number };

export function createStreamResponse(url: string, model: string, parameters: any) {
  let ollamaClient: Ollama;
  try {
    ollamaClient = new Ollama({ host: url });
  } catch (error) {
    throw new WorkflowChainError(
      'Failed to connect to Ollama service',
      'stream',
      error instanceof Error ? error : undefined,
      { url },
    );
  }

  return async function* streamOllamaResponse(
    id: number,
    req: Omit<ChatRequest, 'model' | 'options'> & { stream: true },
  ): AsyncGenerator<StreamYield, string, unknown> {
    const request = req as ChatRequest & { stream: true };
    request.stream = true;
    request.model = model;
    request.options = parameters;

    let response;
    try {
      response = await ollamaClient.chat(request);
    } catch (error) {
      throw new WorkflowChainError(
        'Failed to start chat stream',
        'stream',
        error instanceof Error ? error : undefined,
        { request },
      );
    }

    let buffer = '';
    let lookbehindBuffer = '';
    let hasReceivedContent = false;
    let chunkCount = 0;

    try {
      for await (const chunk of response) {
        chunkCount++;

        if ('error' in chunk) {
          throw new WorkflowChainError(`API error: ${chunk.error}`, 'stream', undefined, { chunk });
        }

        let chunkContent = chunk.message?.content;
        const toolCalls = chunk.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          if (toolCalls[0].function?.arguments) {
            const args = toolCalls[0].function.arguments;
            chunkContent = typeof args === 'string' ? args : JSON.stringify(args);
          }
        }

        if (!chunkContent) {
          continue;
        }

        hasReceivedContent = true;
        buffer += chunkContent;
        lookbehindBuffer += chunkContent;
        yield { type: 'text', content: chunkContent, id };

        if (lookbehindBuffer.length > 1000) {
          lookbehindBuffer = lookbehindBuffer.slice(-500);
        }
      }

      if (hasReceivedContent && buffer.trim() === '') {
      } else if (!hasReceivedContent) {
        throw new WorkflowChainError('No content received from stream', 'stream', undefined, {
          request,
          chunkCount,
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return buffer;
      }

      if (error instanceof WorkflowChainError) {
        throw error;
      }

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
