import axios from 'axios';
import { DEFAULT_CONFIG, OllamaConfig } from '../types/ollama-config';
import { OllamaChatRequest } from '../types/ollama-request';
import {
  OllamaChatResponse,
  OllamaError,
  OllamaStreamResponse,
  StreamCallback,
} from '../types/ollama-response';

// Types
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

// Utility Functions
export function createOllamaConfig(config: OllamaConfig = {}): Required<OllamaConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...config,
  };
}

// API Functions
export async function chat(
  request: OllamaChatRequest,
  config: OllamaConfig = {},
): Promise<OllamaChatResponse> {
  const { baseUrl, defaultModel } = createOllamaConfig(config);

  try {
    const response = await axios.post<OllamaChatResponse>(`${baseUrl}/api/chat`, {
      model: request.model || defaultModel,
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

export async function chatStream(
  request: OllamaChatRequest,
  onMessage: StreamCallback,
  config: OllamaConfig = {},
): Promise<void> {
  const { baseUrl, defaultModel } = createOllamaConfig(config);
  const url = new URL(`${baseUrl}/api/chat`);
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

    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || defaultModel,
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

export async function generateCompletion(
  prompt: string,
  options: Partial<OllamaChatRequest> = {},
  config: OllamaConfig = {},
): Promise<string> {
  const response = await chat(
    {
      model: options.model || config.defaultModel || DEFAULT_CONFIG.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: options.options,
    },
    config,
  );

  return response.message.content;
}

export async function generateCompletionStream(
  prompt: string,
  onMessage: StreamCallback,
  options: Partial<OllamaChatRequest> = {},
  config: OllamaConfig = {},
): Promise<void> {
  return chatStream(
    {
      model: options.model || config.defaultModel || DEFAULT_CONFIG.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      options: options.options,
    },
    onMessage,
    config,
  );
}

export async function listModels(config: OllamaConfig = {}): Promise<string[]> {
  const { baseUrl } = createOllamaConfig(config);

  try {
    const response = await axios.get<{ models: { name: string }[] }>(`${baseUrl}/api/tags`);
    return response.data.models.map(model => model.name);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Ollama API error: ${(error.response.data as OllamaError).error}`);
    }
    throw error;
  }
}

export async function chatWithTools<T extends OllamaChatResponse>(
  request: OllamaChatRequest & { tools: OllamaTool[] },
  onMessage?: StreamCallback,
  config: OllamaConfig = {},
): Promise<T | void> {
  const { baseUrl, defaultModel } = createOllamaConfig(config);

  if (request.stream && onMessage) {
    await chatStream(request, onMessage, config);
    return;
  }

  try {
    const response = await axios.post<T>(`${baseUrl}/api/chat`, {
      model: request.model || defaultModel,
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
