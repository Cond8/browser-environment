import { OllamaModel } from "../services/ollama-types";

export const fetchModels = async (ollamaUrl: string): Promise<OllamaModel[]> => {
  const response = await fetch(`${ollamaUrl}/api/tags`);
  const data = await response.json();
  return data.models;
};

