// src/features/editor/transpilers-json-source/my-json-parser.ts
import { WorkflowStep } from '@/features/chat/models/assistant-message';
import { jsonrepair } from 'jsonrepair';
import { transformToInterface } from './my-json-fixer';

function parseJsonWithErrorHandling(jsonStr: string): WorkflowStep | null {
  try {
    return JSON.parse(jsonStr) as WorkflowStep;
  } catch (error) {
    return null;
  }
}

export function processJsonChunk(chunk: string): WorkflowStep {

  // Try a simplified approach combining all tiers
  let parsedContent = null;

  // Try direct parse
  parsedContent = parseJsonWithErrorHandling(chunk);

  // Try with repair if needed
  if (!parsedContent) {
    const repairedJson = jsonrepair(chunk);
    parsedContent = parseJsonWithErrorHandling(repairedJson);
  }

  // Try transformation if needed
  if (!parsedContent) {
    const transformed = transformToInterface(chunk);
    parsedContent = parseJsonWithErrorHandling(transformed);
  }

  // If we successfully parsed JSON content, return it as a JSON chunk
  if (parsedContent) {
    return parsedContent;
  }

  throw new Error('Failed to parse JSON');
}
