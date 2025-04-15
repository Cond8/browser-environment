// src/features/editor/transpilers-json-source/my-json-parse.ts
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { jsonrepair } from 'jsonrepair';
import { extractTextParts, SLMChunk, SLMOutput } from './extract-text-parse';
import { transformToInterface } from './my-json-fixer';

function parseJsonWithErrorHandling(jsonStr: string): WorkflowStep {
  try {
    return JSON.parse(jsonStr) as WorkflowStep;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
  }
}

function processJsonChunk(chunk: SLMChunk): SLMChunk {
  if (chunk.type !== 'json') {
    return chunk;
  }

  const jsonStr = JSON.stringify(chunk.content);

  // Tier 1: Direct parse
  try {
    return {
      type: 'json',
      content: parseJsonWithErrorHandling(jsonStr),
    };
  } catch (error) {
    console.log('Tier 1 parse failed, trying tier 2...');
  }

  // Tier 2: Library fix then parse
  try {
    const repairedJson = jsonrepair(jsonStr);
    return {
      type: 'json',
      content: parseJsonWithErrorHandling(repairedJson),
    };
  } catch (error) {
    console.log('Tier 2 parse failed, trying tier 3...');
  }

  // Tier 3: Transform to interface structure
  try {
    const transformed = transformToInterface(jsonStr);
    return {
      type: 'json',
      content: parseJsonWithErrorHandling(transformed),
    };
  } catch (error) {
    console.error('All JSON fixing tiers failed');
    // Fallback to text chunk with original content
    return {
      type: 'text',
      content: jsonStr,
    };
  }
}

export function myJsonParse(input: string): SLMOutput {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  const parts = extractTextParts(input);
  return parts.map(processJsonChunk);
}
