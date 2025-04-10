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