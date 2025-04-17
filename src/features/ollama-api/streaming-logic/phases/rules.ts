// src/features/ollama-api/streaming-logic/phases/rules.ts
export const JSON_RULES = `
Rules:
- Single valid JSON object
- Wrapped in markdown code fences
- No prose or extra fields
`.trim();
