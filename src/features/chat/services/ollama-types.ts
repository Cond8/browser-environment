// src/features/chat/services/ollama-types.ts

// -------------------------
// Configuration
// -------------------------
export interface OllamaConfig {
  baseUrl?: string;
  defaultModel?: string;
}

export const DEFAULT_CONFIG: Required<OllamaConfig> = {
  baseUrl: 'http://localhost:11434',
  defaultModel: 'phi4-mini:latest',
};

// -------------------------
// Message Types
// -------------------------

export type OllamaRole = 'user' | 'assistant' | 'system' | 'tool';

export interface OllamaMessage {
  role: OllamaRole;
  content: string;
  name?: string; // used for tool role
  images?: string[]; // for multimodal support (e.g. llava model)
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

// For easier tool handling
export interface ParsedToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

// -------------------------
// Tool Schema
// -------------------------
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

// -------------------------
// Chat Request
// -------------------------
export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  format?: 'json';
  raw?: boolean; // tells the model not to apply formatting or templating
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
    num_ctx?: number;
    num_gqa?: number;
    num_gpu?: number;
    num_thread?: number;
    repeat_last_n?: number;
    mirostat?: 0 | 1 | 2;
    mirostat_eta?: number;
    mirostat_tau?: number;
  };
  template?: string;
  keep_alive?: string;
  tools?: OllamaTool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

// -------------------------
// Chat Response (base)
// -------------------------
export interface BaseOllamaResponse {
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

// Single response (non-streaming)
export interface OllamaChatResponse extends BaseOllamaResponse {}

// Streamed response
export interface OllamaStreamResponse extends BaseOllamaResponse {}

// Error
export interface OllamaError {
  error: string;
  status?: number;
  details?: unknown;
}

// -------------------------
// Streaming Callback
// -------------------------
export type StreamCallback = (response: OllamaStreamResponse) => void;

// -------------------------
// Helper Types and Functions
// -------------------------

export interface OllamaToolResultMessage {
  role: 'tool';
  name: string;
  content: string;
}

/**
 * Creates a tool result message for the chat
 */
export function createToolResultMessage(toolName: string, result: unknown): OllamaMessage {
  return {
    role: 'tool',
    name: toolName,
    content: JSON.stringify(result),
  };
}

/**
 * Parses tool calls into a more convenient format
 */
export function parseToolCalls(calls: OllamaToolCall[]): ParsedToolCall[] {
  return calls.map(c => ({
    id: c.id,
    name: c.function.name,
    args: JSON.parse(c.function.arguments),
  }));
}

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
