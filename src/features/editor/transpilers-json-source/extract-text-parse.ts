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

  // First handle code fence blocks to avoid confusing example JSON with actual JSON
  const codeFenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/g;
  let codeFenceMatch;
  const processedRanges: Array<[number, number]> = [];

  while ((codeFenceMatch = codeFenceRegex.exec(input)) !== null) {
    const matchStart = codeFenceMatch.index;
    const matchEnd = matchStart + codeFenceMatch[0].length;
    processedRanges.push([matchStart, matchEnd]);

    // Add text before the code fence if it exists
    const textBefore = input.substring(currentIndex, matchStart).trim();
    if (textBefore) {
      chunks.push({ type: 'text', content: textBefore });
    }

    // Try to parse the code fence content as JSON
    try {
      const jsonContent = codeFenceMatch[1].trim();
      const parsedJson = JSON.parse(jsonContent);

      // Only process if it's a valid object and doesn't look like an example
      if (
        typeof parsedJson === 'object' &&
        parsedJson !== null &&
        !jsonContent.includes('// ... more') &&
        !jsonContent.includes('// Example')
      ) {
        if ('interface' in parsedJson || 'type' in parsedJson) {
          chunks.push({ type: 'json', content: parsedJson });
        } else {
          chunks.push({ type: 'text', content: codeFenceMatch[0] });
        }
      } else {
        chunks.push({ type: 'text', content: codeFenceMatch[0] });
      }
    } catch (error) {
      chunks.push({ type: 'text', content: codeFenceMatch[0] });
    }

    currentIndex = matchEnd;
  }

  // Then look for JSON objects in the remaining unprocessed text
  const remainingRanges = getUnprocessedRanges(input.length, processedRanges);
  for (const [start, end] of remainingRanges) {
    const text = input.substring(start, end);
    const jsonRegex = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;
    let match;
    let lastIndex = 0;

    while ((match = jsonRegex.exec(text)) !== null) {
      // Add text before the JSON if it exists
      const textBefore = text.substring(lastIndex, match.index).trim();
      if (textBefore) {
        chunks.push({ type: 'text', content: textBefore });
      }

      try {
        const jsonStr = match[0];
        const parsedJson = JSON.parse(jsonStr);

        if (typeof parsedJson === 'object' && parsedJson !== null) {
          if ('interface' in parsedJson || 'type' in parsedJson) {
            chunks.push({ type: 'json', content: parsedJson });
          } else {
            chunks.push({ type: 'text', content: jsonStr });
          }
        }
      } catch (error) {
        // If JSON parsing fails, treat as text
        chunks.push({ type: 'text', content: match[0] });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    const remainingText = text.substring(lastIndex).trim();
    if (remainingText) {
      chunks.push({ type: 'text', content: remainingText });
    }
  }

  return chunks;
}

function getUnprocessedRanges(
  totalLength: number,
  processedRanges: Array<[number, number]>,
): Array<[number, number]> {
  const sortedRanges = [...processedRanges].sort((a, b) => a[0] - b[0]);
  const unprocessedRanges: Array<[number, number]> = [];
  let currentPos = 0;

  for (const [start, end] of sortedRanges) {
    if (currentPos < start) {
      unprocessedRanges.push([currentPos, start]);
    }
    currentPos = end;
  }

  if (currentPos < totalLength) {
    unprocessedRanges.push([currentPos, totalLength]);
  }

  return unprocessedRanges;
}
