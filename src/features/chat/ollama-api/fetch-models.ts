// src/features/chat/ollama-api/fetch-models.ts

import { ModelResponse } from "ollama";

export const fetchModels = async (ollamaUrl: string): Promise<ModelResponse[]> => {
  const response = await fetch(`${ollamaUrl}/api/tags`);
  const data = await response.json();
  return data.models;
};

