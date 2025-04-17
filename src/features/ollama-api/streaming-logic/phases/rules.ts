// src/features/ollama-api/streaming/phases/steps/common.ts
export const JSON_RULES = `
Rules:
- Single valid JSON object
- Wrapped in markdown code fences
- No prose or extra fields
`.trim();
