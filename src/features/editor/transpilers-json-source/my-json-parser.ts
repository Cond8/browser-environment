// src/features/editor/transpilers-json-source/my-json-parser.ts
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { jsonrepair } from 'jsonrepair';
import { extractTextParts, SLMChunk, SLMOutput } from './extract-text-parse';
import { transformToInterface } from './my-json-fixer';

function parseJsonWithErrorHandling(jsonStr: string): WorkflowStep | null {
  try {
    return JSON.parse(jsonStr) as WorkflowStep;
  } catch (error) {
    return null;
  }
}

export function processJsonChunk(chunk: SLMChunk): SLMChunk {
  // Skip if not a string or already JSON
  if (chunk.type === 'json') return chunk;
  if (typeof chunk.content !== 'string') return chunk;

  const content = chunk.content.trim();
  if (!content) return chunk;

  // Try a simplified approach combining all tiers
  let parsedContent = null;

  // Try direct parse
  parsedContent = parseJsonWithErrorHandling(content);

  // Try with repair if needed
  if (!parsedContent) {
    try {
      const repairedJson = jsonrepair(content);
      parsedContent = parseJsonWithErrorHandling(repairedJson);
    } catch (error) {
      // Skip if repair fails
    }
  }

  // Try transformation if needed
  if (!parsedContent) {
    try {
      const transformed = transformToInterface(content);
      parsedContent = parseJsonWithErrorHandling(transformed);
    } catch (error) {
      // Skip if transformation fails
    }
  }

  return {
    type: 'text',
    content: content,
  };
}

export function myJsonParser(input: string): SLMOutput {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  return extractTextParts(input);
}
