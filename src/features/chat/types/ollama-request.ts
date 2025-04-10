import { OllamaMessage } from './ollama-message';
import { OllamaTool } from './ollama-tool';

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
