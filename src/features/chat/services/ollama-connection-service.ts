import axios, { AxiosError } from 'axios';

export interface OllamaMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaCompletionResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_ctx?: number;
  num_thread?: number;
  repeat_penalty?: number;
  stop?: string[];
  num_predict?: number;
  num_keep?: number;
  seed?: number;
  tfs_z?: number;
  typical_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  mirostat?: number;
  mirostat_tau?: number;
  mirostat_eta?: number;
  penalize_newline?: boolean;
}

export class OllamaConnectionService {
  private baseUrl: string;
  private model: string;
  private options: OllamaOptions;
  private axiosInstance;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    model: string = 'phi4-mini:latest',
    options: OllamaOptions = {},
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.options = options;

    // Create axios instance with default config
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Chat methods
  async sendMessage(
    messages: OllamaMessage[],
    stream: boolean = false,
  ): Promise<OllamaChatResponse> {
    try {
      const response = await this.axiosInstance.post('/api/chat', {
        model: this.model,
        messages,
        stream,
        options: this.options,
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Ollama API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async sendMessageStream(
    messages: OllamaMessage[],
    onMessage: (response: OllamaChatResponse) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      const response = await this.axiosInstance.post(
        '/api/chat',
        {
          model: this.model,
          messages,
          stream: true,
          options: this.options,
        },
        {
          responseType: 'stream',
        },
      );

      const stream = response.data;
      for await (const chunk of stream) {
        const lines = chunk
          .toString()
          .split('\n')
          .filter((line: string) => line.trim() !== '');
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            onMessage(data);
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
            onError?.(e instanceof Error ? e : new Error('Failed to parse stream chunk'));
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.error || error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      console.error('Error in Ollama stream:', errorMessage);
      onError?.(new Error(errorMessage));
      throw error;
    }
  }

  // Code completion methods
  async generateCompletion(
    prompt: string,
    stream: boolean = false,
  ): Promise<OllamaCompletionResponse> {
    try {
      const response = await this.axiosInstance.post('/api/generate', {
        model: this.model,
        prompt,
        stream,
        options: this.options,
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Ollama API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async generateCompletionStream(
    prompt: string,
    onResponse: (response: OllamaCompletionResponse) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      const response = await this.axiosInstance.post(
        '/api/generate',
        {
          model: this.model,
          prompt,
          stream: true,
          options: this.options,
        },
        {
          responseType: 'stream',
        },
      );

      const stream = response.data;
      for await (const chunk of stream) {
        const lines = chunk
          .toString()
          .split('\n')
          .filter((line: string) => line.trim() !== '');
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            onResponse(data);
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
            onError?.(e instanceof Error ? e : new Error('Failed to parse stream chunk'));
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.error || error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      console.error('Error in completion stream:', errorMessage);
      onError?.(new Error(errorMessage));
      throw error;
    }
  }

  // Model management methods
  setModel(model: string): void {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  setOptions(options: OllamaOptions): void {
    this.options = { ...this.options, ...options };
  }

  getOptions(): OllamaOptions {
    return this.options;
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/api/tags');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // List available models
  async listModels(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/api/tags');
      return response.data.models.map((model: any) => model.name);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to list models: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }
}
