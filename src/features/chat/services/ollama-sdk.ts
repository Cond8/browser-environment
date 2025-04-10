import axios from 'axios';
import { z } from 'zod';

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: OllamaToolCall[];
}

export interface OllamaToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface OllamaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<
        string,
        {
          type: string;
          description?: string;
          enum?: string[];
        }
      >;
      required?: string[];
    };
  };
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  tools?: OllamaTool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

export interface OllamaStreamResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

export interface OllamaError {
  error: string;
}

export type StreamCallback = (response: OllamaStreamResponse) => void;

export function zodToOllamaTool(
  schema: z.ZodType<any>,
  name: string,
  description: string,
): OllamaTool {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Schema must be a ZodObject');
  }

  const shape = schema.shape;
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    if (!(value instanceof z.ZodType)) {
      continue;
    }

    let type: string;
    let description: string | undefined;
    let enumValues: string[] | undefined;

    if (value instanceof z.ZodString) {
      type = 'string';
      description = value.description;
    } else if (value instanceof z.ZodNumber) {
      type = 'number';
      description = value.description;
    } else if (value instanceof z.ZodBoolean) {
      type = 'boolean';
      description = value.description;
    } else if (value instanceof z.ZodEnum) {
      type = 'string';
      enumValues = value.options;
      description = value.description;
    } else if (value instanceof z.ZodArray) {
      type = 'array';
      description = value.description;
    } else if (value instanceof z.ZodObject) {
      type = 'object';
      description = value.description;
    } else {
      throw new Error(`Unsupported Zod type: ${value.constructor.name}`);
    }

    properties[key] = {
      type,
      description,
      ...(enumValues && { enum: enumValues }),
    };

    if (!value.isOptional()) {
      required.push(key);
    }
  }

  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: {
        type: 'object',
        properties,
        ...(required.length > 0 && { required }),
      },
    },
  };
}

export class OllamaService {
  private _baseUrl: string;
  private defaultModel: string;

  constructor(config: { baseUrl?: string; defaultModel?: string } = {}) {
    this._baseUrl = config.baseUrl || 'http://localhost:11434';
    this.defaultModel = config.defaultModel || 'phi4-mini:latest';
  }

  get baseUrl(): string {
    return this._baseUrl;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    try {
      const response = await axios.post<OllamaChatResponse>(`${this.baseUrl}/api/chat`, {
        model: request.model || this.defaultModel,
        messages: request.messages,
        stream: request.stream || false,
        options: request.options,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Ollama API error: ${(error.response.data as OllamaError).error}`);
      }
      throw error;
    }
  }

  async chatStream(request: OllamaChatRequest, onMessage: StreamCallback): Promise<void> {
    const url = new URL(`${this.baseUrl}/api/chat`);
    const eventSource = new EventSource(url.toString(), {
      withCredentials: false,
    });

    return new Promise((resolve, reject) => {
      eventSource.onmessage = event => {
        try {
          const response = JSON.parse(event.data) as OllamaStreamResponse;
          onMessage(response);

          if (response.done) {
            eventSource.close();
            resolve();
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = error => {
        eventSource.close();
        reject(error);
      };

      // Send the request data
      fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          messages: request.messages,
          stream: true,
          options: request.options,
        }),
      }).catch(error => {
        eventSource.close();
        reject(error);
      });
    });
  }

  async generateCompletion(
    prompt: string,
    options: Partial<OllamaChatRequest> = {},
  ): Promise<string> {
    const response = await this.chat({
      model: options.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: options.options,
    });

    return response.message.content;
  }

  async generateCompletionStream(
    prompt: string,
    onMessage: StreamCallback,
    options: Partial<OllamaChatRequest> = {},
  ): Promise<void> {
    return this.chatStream(
      {
        model: options.model || this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        options: options.options,
      },
      onMessage,
    );
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get<{ models: { name: string }[] }>(`${this.baseUrl}/api/tags`);
      return response.data.models.map(model => model.name);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Ollama API error: ${(error.response.data as OllamaError).error}`);
      }
      throw error;
    }
  }

  async chatWithTools<T extends OllamaChatResponse>(
    request: OllamaChatRequest & { tools: OllamaTool[] },
    onMessage?: StreamCallback,
  ): Promise<T | void> {
    if (request.stream && onMessage) {
      await this.chatStream(request, onMessage);
      return;
    }

    try {
      const response = await axios.post<T>(`${this.baseUrl}/api/chat`, {
        model: request.model || this.defaultModel,
        messages: request.messages,
        stream: request.stream || false,
        tools: request.tools,
        tool_choice: request.tool_choice || 'auto',
        options: request.options,
      });

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Ollama API error: ${(error.response.data as OllamaError).error}`);
      }
      throw error;
    }
  }
}

// Create a default instance
export const ollama = new OllamaService();
