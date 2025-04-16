// src/features/ollama-api/streaming/phases/types.ts
export type WorkflowPhase = 'interface' | 'step' | 'stream' | 'alignment';

export type UserRequest = {
  userRequest: string;
  alignmentResponse: string;
};
