import { DEFAULT_CONFIG, OllamaConfig } from '../types/ollama-config';
import { OllamaChatRequest } from '../types/ollama-request';
import { OllamaStreamResponse, StreamCallback } from '../types/ollama-response';

// Types
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

export async function chatWithTools(
  request: OllamaChatRequest & { tools: OllamaTool[] },
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
        tools: request.tools,
        tool_choice: request.tool_choice || 'auto',
        options: request.options,
      }),
    }).catch(error => {
      eventSource.close();
      reject(error);
    });
  });
}
