// src/features/editor/transpilers-json-source/extract-text-parse.ts
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';

export type SLMChunk = { type: 'text'; content: string } | { type: 'json'; content: WorkflowStep };

export type SLMOutput = SLMChunk[];

export class TextExtractionError extends Error {
  constructor(
    message: string,
    public readonly context?: unknown,
  ) {
    super(message);
    this.name = 'TextExtractionError';
  }
}

export function extractTextParts(input: string): SLMOutput {
  if (typeof input !== 'string') {
    throw new TextExtractionError('Input must be a string', { input });
  }

  if (!input.trim()) {
    return [];
  }

  const chunks: SLMOutput = [];
  let currentIndex = 0;

  // Regular expression to match code fences with optional json specifier
  const codeFenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/g;
  let match;

  try {
    while ((match = codeFenceRegex.exec(input)) !== null) {
      // Add text before the code fence if it exists
      const textBefore = input.substring(currentIndex, match.index).trim();
      if (textBefore) {
        chunks.push({ type: 'text', content: textBefore });
      }

      // Try to parse the JSON content
      const jsonContent = match[1].trim();
      try {
        const parsedJson = JSON.parse(jsonContent);

        // Validate that the parsed JSON is an object
        if (typeof parsedJson !== 'object' || parsedJson === null) {
          throw new TextExtractionError('JSON content must be an object', { jsonContent });
        }

        // Check for either WorkflowStep type or interface structure
        if ('type' in parsedJson) {
          // This is a WorkflowStep
          if (typeof parsedJson.type !== 'string') {
            throw new TextExtractionError('WorkflowStep type must be a string', { jsonContent });
          }
        } else if ('interface' in parsedJson) {
          // This is an interface structure
          if (typeof parsedJson.interface !== 'object' || parsedJson.interface === null) {
            throw new TextExtractionError('Interface must be an object', { jsonContent });
          }
          // Add type property to make it compatible with WorkflowStep
          parsedJson.type = 'interface';
        } else {
          throw new TextExtractionError('JSON must contain either "type" or "interface" property', {
            jsonContent,
          });
        }

        chunks.push({ type: 'json', content: parsedJson });
      } catch (error) {
        if (error instanceof TextExtractionError) {
          throw error;
        }
        // If JSON parsing fails, treat it as text
        chunks.push({ type: 'text', content: jsonContent });
      }

      // Update the current index to after the code fence
      currentIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last code fence
    const remainingText = input.substring(currentIndex).trim();
    if (remainingText) {
      chunks.push({ type: 'text', content: remainingText });
    }

    return chunks;
  } catch (error) {
    if (error instanceof TextExtractionError) {
      throw error;
    }
    throw new TextExtractionError('Failed to extract text parts', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input: input.substring(0, 100) + '...', // Include first 100 chars for context
    });
  }
}
