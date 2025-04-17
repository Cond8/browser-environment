// src/features/editor/transpilers-json-source/my-json-parser.ts
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
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
  if (!chunk || typeof chunk !== 'string') {
    throw new Error('Invalid chunk provided');
  }

  // Check if content is purely markdown without JSON
  if (isPureMarkdown(chunk)) {
    console.warn('Content is purely markdown without any JSON content');
    return {
      name: 'MarkdownContent',
      module: 'format',
      functionName: 'process_markdown',
      goal: 'Process markdown content',
      params: {
        content: { type: 'string', description: 'Markdown content to process' },
      },
      returns: {
        output: { type: 'string', description: 'Processed markdown content' },
      },
    };
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
  return {
    name: 'DefaultWorkflow',
    module: 'transform',
    functionName: 'process_data',
    goal: 'Process input data',
    params: {
      input: { type: 'string', description: 'Input data to process' },
    },
    returns: {
      output: { type: 'string', description: 'Processed output data' },
    },
  };
}
