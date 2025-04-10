import { CoreMessage, streamText, ToolChoice, ToolSet } from 'ai';
import { createOllama } from 'ollama-ai-provider';

export interface OllamaResponse {
  message: {
    content: string;
  };
}

export interface OllamaError extends Error {
  code?: string;
  status?: number;
}

export class OllamaConnectionService {
  private ollama;
  private model: string;
  private baseUrl: string;

  constructor(
    baseUrl: string,
    model: string,
    options: {
      temperature?: number;
      topP?: number;
      topK?: number;
      repeatPenalty?: number;
      numCtx?: number;
    } = {},
  ) {
    this.model = model;
    this.baseUrl = baseUrl;
    this.ollama = createOllama({
      baseURL: baseUrl,
      headers: {
        'X-Ollama-Options': JSON.stringify({
          ...options,
          num_ctx: options.numCtx, // Convert to snake_case for Ollama API
        }),
      },
    });
  }

  async sendMessageStream(
    messages: CoreMessage[],
    onResponse: (response: OllamaResponse) => void,
    onError: (error: OllamaError) => void,
    tools?: ToolSet,
    toolChoice?: ToolChoice<ToolSet>,
  ): Promise<void> {
    try {
      const result = streamText({
        model: this.ollama(this.model),
        messages,
        tools,
        toolChoice,
      });

      let fullResponse = '';
      for await (const delta of result.textStream) {
        fullResponse += delta;
        onResponse({
          message: {
            content: fullResponse,
          },
        });
      }
    } catch (error) {
      const ollamaError: OllamaError =
        error instanceof Error ? error : new Error('Unknown error occurred');
      if (error instanceof Error && 'status' in error) {
        ollamaError.status = (error as any).status;
      }
      onError(ollamaError);
    }
  }

  // Add a method to check if the service is available
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
