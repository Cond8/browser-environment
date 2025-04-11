// src/lib/ollama/index.ts
export * from './types';

import {
  DEFAULT_CONFIG,
  OllamaChatRequest,
  OllamaConfig,
  OllamaError,
  OllamaStreamResponse,
  OllamaTool,
  StreamCallback,
} from './types';

export function createOllamaClient(initialConfig: OllamaConfig = {}) {
  let config: Required<OllamaConfig> = {
    ...DEFAULT_CONFIG,
    ...initialConfig,
  };

  const updateConfig = (newConfig: Partial<OllamaConfig>) => {
    config = { ...config, ...newConfig };
  };

  const chatWithTools = async (
    request: OllamaChatRequest & { tools: OllamaTool[] },
    onMessage: StreamCallback,
  ): Promise<void> => {
    const url = new URL(`${config.baseUrl}/api/chat`);
    const eventSource = new EventSource(url.toString(), {
      withCredentials: false,
    });

    return new Promise((resolve, reject) => {
      let hasError = false;

      eventSource.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data) as OllamaStreamResponse | OllamaError;

          if ('error' in response) {
            hasError = true;
            eventSource.close();
            reject(new Error(response.error));
            return;
          }

          onMessage(response);

          if (response.done) {
            eventSource.close();
            if (!hasError) {
              resolve();
            }
          }
        } catch (error) {
          hasError = true;
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = (error) => {
        hasError = true;
        eventSource.close();
        reject(error);
      };

      fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || config.defaultModel,
          messages: request.messages,
          stream: true,
          tools: request.tools,
          tool_choice: request.tool_choice || 'auto',
          options: request.options,
        }),
      }).catch((error) => {
        hasError = true;
        eventSource.close();
        reject(error);
      });
    });
  };

  const chat = async (request: OllamaChatRequest): Promise<OllamaStreamResponse> => {
    const url = new URL(`${config.baseUrl}/api/chat`);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || config.defaultModel,
        messages: request.messages,
        stream: false,
        options: request.options,
        format: request.format,
        template: request.template,
        keep_alive: request.keep_alive,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as OllamaError;
      throw new Error(error.error);
    }

    return response.json();
  };

  const listModels = async (): Promise<string[]> => {
    const url = new URL(`${config.baseUrl}/api/tags`);
    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = (await response.json()) as OllamaError;
      throw new Error(error.error);
    }

    const data = await response.json();
    return data.models.map((m: { name: string }) => m.name);
  };

  const checkConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.defaultModel,
          messages: [{ role: 'user', content: 'test' }],
          stream: false,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  return {
    updateConfig,
    chatWithTools,
    chat,
    listModels,
    checkConnection,
  };
}
