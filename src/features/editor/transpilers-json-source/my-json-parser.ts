// src/features/editor/transpilers-json-source/my-json-parser.ts
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { createDefaultWorkflowStep } from '@/utils/workflow-helpers';
import { jsonrepair } from 'jsonrepair';
import { transformToInterface } from './my-json-fixer';

function parseJsonWithErrorHandling(jsonStr: string): WorkflowStep | null {
  try {
    return JSON.parse(jsonStr) as WorkflowStep;
  } catch (error: unknown) {
    console.log('[MY JSON Parser] Failed to parse JSON directly:', (error as Error)?.message, {jsonStr});
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
    console.warn('Null or non-string chunk provided to processJsonChunk');
    return createDefaultWorkflowStep('EmptyContent', 'process_empty', 'Process empty content');
  }

  // Trim the chunk for better handling
  const trimmedChunk = chunk.trim();

  if (!trimmedChunk) {
    console.warn('Empty chunk provided to processJsonChunk');
    return createDefaultWorkflowStep('EmptyContent', 'process_empty', 'Process empty content');
  }

  // Check if content is purely markdown without JSON
  if (isPureMarkdown(trimmedChunk)) {
    return createDefaultWorkflowStep(
      'MarkdownContent',
      'process_markdown',
      'Process markdown content',
    );
  }

  // Check if it's a partial JSON that doesn't have a closing brace
  const hasOpenBrace = trimmedChunk.includes('{');
  const hasCloseBrace = trimmedChunk.includes('}');

  if (hasOpenBrace && !hasCloseBrace) {
    console.warn('Partial JSON chunk detected (no closing brace)');
    return createDefaultWorkflowStep(
      'PartialJson',
      'process_partial',
      'Process partial JSON content',
    );
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
    console.warn('Failed to repair JSON:', repairError);
  }

  // Try transformation
  try {
    const transformed = transformToInterface(contentToParse);
    parsedContent = parseJsonWithErrorHandling(transformed);

    if (parsedContent) {
      return parsedContent;
    }
  } catch (transformError) {
    console.warn('Failed to transform content:', transformError);
  }

  // If all else fails, return a default workflow step
  console.warn('Failed to parse JSON content, returning default workflow step');
  return createDefaultWorkflowStep('DefaultWorkflow', 'process_data', 'Process input data');
}
