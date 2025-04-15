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
  // Try to process all chunks as potential JSON
  const content = typeof chunk.content === 'string' ? chunk.content : JSON.stringify(chunk.content);

  // Tier 1: Direct parse
  try {
    const parsed = parseJsonWithErrorHandling(content);
    return {
      type: 'json',
      content: parsed,
    };
  } catch (error) {
    console.log('Tier 1 parse failed, trying tier 2...');
  }

  // Tier 2: Library fix then parse
  try {
    const repairedJson = jsonrepair(content);
    const parsed = parseJsonWithErrorHandling(repairedJson);
    return {
      type: 'json',
      content: parsed,
    };
  } catch (error) {
    console.log('Tier 2 parse failed, trying tier 3...');
  }

  // Tier 3: Transform to interface structure
  try {
    const transformed = transformToInterface(content);
    const parsed = parseJsonWithErrorHandling(transformed);
    return {
      type: 'json',
      content: parsed,
    };
  } catch (error) {
    console.log('All JSON fixing tiers failed, keeping as text');
    // If all parsing attempts fail, keep as text
    return {
      type: 'text',
      content: content,
    };
  }
}

export function myJsonParser(input: string): SLMOutput {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  const parts = extractTextParts(input);
  return parts.map(processJsonChunk);
}
