// src/features/editor/transpilers-json-source/my-json-parser.ts
import { jsonrepair } from 'jsonrepair';
import { transformToInterface } from './my-json-fixer';
import type { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';

function parseJsonWithErrorHandling(jsonStr: string): WorkflowStep | null {
  try {
    return JSON.parse(jsonStr) as WorkflowStep;
  } catch (error: unknown) {
    void error;
    return null;
  }
}

function extractJsonFromMarkdown(content: string): string | null {
  // Look for JSON code blocks
  const jsonBlockMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Look for standalone JSON objects
  const jsonMatch = content.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  return null;
}

function isPureMarkdown(content: string): boolean {
  // Check if content contains markdown elements but no JSON
  const hasMarkdown = /^#|^-|^\*|^```|^>/.test(content);
  const hasJson = /```json|{[\s\S]*?}/.test(content);
  return hasMarkdown && !hasJson;
}

export function processJsonChunk(chunk: string): WorkflowStep {
  // Handle empty or invalid input more gracefully
  if (!chunk || typeof chunk !== 'string') {
    throw new Error('Invalid chunk provided to processJsonChunk');
  }

  // Trim the chunk for better handling
  const trimmedChunk = chunk.trim();

  if (!trimmedChunk) {
    throw new Error('Empty chunk provided to processJsonChunk');
  }

  // Check if content is purely markdown without JSON
  if (isPureMarkdown(trimmedChunk)) {
    throw new Error('Markdown content provided to processJsonChunk');
  }

  // Check if it's a partial JSON that doesn't have a closing brace
  const hasOpenBrace = trimmedChunk.includes('{');
  const hasCloseBrace = trimmedChunk.includes('}');

  if (hasOpenBrace && !hasCloseBrace) {
    throw new Error('Partial JSON chunk detected (no closing brace)');
  }

  // First try to extract JSON from markdown if present
  const extractedJson = extractJsonFromMarkdown(trimmedChunk);
  const contentToParse = extractedJson || trimmedChunk;

  // Try direct parse
  let parsedContent = parseJsonWithErrorHandling(contentToParse);

  if (parsedContent) {
    return parsedContent;
  }

  // Try repair
  try {
    const repairedJson = jsonrepair(contentToParse);
    parsedContent = parseJsonWithErrorHandling(repairedJson);

    if (parsedContent) {
      return parsedContent;
    }
  } catch (repairError) {
    console.log('Failed to repair JSON:', repairError);
  }

  // Try transformation
  try {
    const transformed = transformToInterface(contentToParse);
    parsedContent = parseJsonWithErrorHandling(transformed);

    if (parsedContent) {
      return parsedContent;
    }
  } catch (transformError) {
    console.log('Failed to transform content:', transformError);
  }

  // If all else fails, return a default workflow step
  throw new Error('Failed to parse JSON content');
}
