// src/features/ollama-api/prompts/prompts-system.ts
export const SYSTEM_PROMPT = (PROMPT: string) =>
  `
You are an assistant that generates structured **JSON-based interfaces** for workflows.

${PROMPT}
`.trim();
