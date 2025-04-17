// src/features/ollama-api/streaming/phases/types.ts
export type WorkflowPhase = 'interface' | 'step' | 'stream' | 'alignment';

export type UserRequest = {
  userRequest: string;
};

export interface AssistantTextChunk {
  type: 'text';
  content: string;
}

export interface AssistantJsonChunk {
  type: 'json';
  content: string;
}

export type AssistantChunk = AssistantTextChunk | AssistantJsonChunk;

export interface WorkflowStep {
  name: string;
  module: string;
  functionName: string;
  goal: string;
  params: any;
  returns: any;
  rawContent?: string; // Optional raw content for storing unparsed JSON
}
