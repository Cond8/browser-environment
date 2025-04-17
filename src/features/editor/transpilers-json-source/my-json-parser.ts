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
  // Check if content is purely markdown without JSON
  if (isPureMarkdown(chunk)) {
    throw new Error('Content is purely markdown without any JSON content');
  }

  // First try to extract JSON from markdown if present
  const extractedJson = extractJsonFromMarkdown(chunk);
  const contentToParse = extractedJson || chunk;

  // Try direct parse
  let parsedContent = parseJsonWithErrorHandling(contentToParse);


  if (parsedContent) {
    return parsedContent;
  }

  // Try repair
  const repairedJson = jsonrepair(contentToParse);

  // Try parse repaired JSON
  parsedContent = parseJsonWithErrorHandling(repairedJson);

  if (parsedContent) {
    return parsedContent;
  }

  // Try transformation
  const transformed = transformToInterface(contentToParse);
  parsedContent = parseJsonWithErrorHandling(transformed);

  if (parsedContent) {
    return parsedContent;
  }

  // Try repair and transformation
  const transformedRepaired = transformToInterface(repairedJson);
  parsedContent = parseJsonWithErrorHandling(transformedRepaired);

  if (parsedContent) {
    return parsedContent;
  }

  throw new Error('Failed to parse JSON');
}
