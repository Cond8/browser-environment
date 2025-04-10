export interface OllamaConfig {
  baseUrl?: string;
  defaultModel?: string;
}

export const DEFAULT_CONFIG: Required<OllamaConfig> = {
  baseUrl: 'http://localhost:11434',
  defaultModel: 'phi4-mini:latest',
};
