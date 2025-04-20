// src/features/ollama-api/prompts/createPrompt.ts
import { AssistantResponse } from './assistant-response';

export const createPrompt =
  (
    strings: TemplateStringsArray,
    ...interpolations: ((ctx: {
      userReq: string;
      assistantResponse: AssistantResponse;
      step: string;
    }) => string | number | undefined | null)[]
  ) =>
  (userReq: string, assistantResponse: AssistantResponse, step: string): string => {
    const ctx = { userReq, assistantResponse, step };

    return strings.reduce((acc, str, i) => {
      const value = i < interpolations.length ? interpolations[i](ctx) : '';
      return acc + str + value;
    }, '');
  };
