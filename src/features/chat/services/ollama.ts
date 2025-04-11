// src/features/chat/services/ollama.ts
export * from './ollama-types';

import {
  DEFAULT_CONFIG,
  OllamaChatRequest,
  OllamaConfig,
  OllamaError,
  OllamaStreamResponse,
  OllamaTool,
  StreamCallback,
} from './ollama-types';

export interface OllamaClient {
  defaultModel: string;
  updateConfig: (newConfig: Partial<OllamaConfig>) => void;
  chatWithTools: (
    request: OllamaChatRequest & { tools: OllamaTool[] },
    onMessage: StreamCallback,
    abortSignal?: AbortSignal,
  ) => Promise<void>;
  chat: (request: OllamaChatRequest) => Promise<OllamaStreamResponse>;
  listModels: () => Promise<string[]>;
  checkConnection: () => Promise<boolean>;
}

export function createOllamaClient(initialConfig: OllamaConfig = {}): OllamaClient {
  console.log('[OllamaClient] Creating client with config:', initialConfig);
  let config: Required<OllamaConfig> = {
    ...DEFAULT_CONFIG,
    ...initialConfig,
  };

  const updateConfig: (newConfig: Partial<OllamaConfig>) => void = newConfig => {
    console.log('[OllamaClient] Updating config:', newConfig);
    config = { ...config, ...newConfig };
  };

  const chatWithTools: OllamaClient['chatWithTools'] = async (request, onMessage, abortSignal?) => {
    console.log('[OllamaClient] Starting chatWithTools:', {
      model: request.model,
      messageCount: request.messages.length,
      toolCount: request.tools.length,
    });

    const url = new URL(`${config.baseUrl}/api/chat`);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortSignal,
      body: JSON.stringify({
        model: request.model || config.defaultModel,
        messages: request.messages,
        stream: true,
        tools: request.tools,
        tool_choice: request.tool_choice || 'auto',
        options: request.options,
      }),
    });

    if (!response.ok || !response.body) {
      console.error('[OllamaClient] Chat request failed:', response.status);
      const error = (await response.json()) as OllamaError;
      throw new Error(error.error || 'Failed to connect to Ollama stream');
    }

    console.log('[OllamaClient] Chat stream started');
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      if (abortSignal?.aborted) {
        console.log('[OllamaClient] Stream aborted');
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) {
        console.log('[OllamaClient] Stream completed');
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line || line === 'data: [DONE]') {
          console.log('[OllamaClient] Stream done');
          continue;
        }

        try {
          const parsed = JSON.parse(line.startsWith('data:') ? line.slice(5).trim() : line);
          if ('error' in parsed) {
            console.error('[OllamaClient] Stream error:', parsed.error);
            throw new Error(parsed.error);
          }
          console.log('[OllamaClient] Received chunk:', parsed);
          onMessage(parsed);
        } catch (err) {
          console.error('[OllamaClient] Failed to parse message:', err);
        }
      }
    }
  };

  const chat: OllamaClient['chat'] = async request => {
    console.log('[OllamaClient] Starting chat:', {
      model: request.model,
      messageCount: request.messages.length,
    });

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
      console.error('[OllamaClient] Chat request failed:', response.status);
      const error = (await response.json()) as OllamaError;
      throw new Error(error.error);
    }

    const result = await response.json();
    console.log('[OllamaClient] Chat response:', result);
    return result;
  };

  const listModels: OllamaClient['listModels'] = async () => {
    console.log('[OllamaClient] Listing models');
    const url = new URL(`${config.baseUrl}/api/tags`);
    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error('[OllamaClient] List models failed:', response.status);
      const error = (await response.json()) as OllamaError;
      throw new Error(error.error);
    }

    const data = await response.json();
    console.log('[OllamaClient] Models:', data.models);
    return data.models.map((m: { name: string }) => m.name);
  };

  const checkConnection: OllamaClient['checkConnection'] = async () => {
    console.log('[OllamaClient] Checking connection');
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
      console.log('[OllamaClient] Connection check result:', response.ok);
      return response.ok;
    } catch (err) {
      console.error('[OllamaClient] Connection check failed:', err);
      return false;
    }
  };

  return {
    defaultModel: config.defaultModel,
    updateConfig,
    chatWithTools,
    chat,
    listModels,
    checkConnection,
  };
}
