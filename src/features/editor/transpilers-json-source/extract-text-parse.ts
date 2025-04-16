// src/features/editor/transpilers-json-source/extract-text-parse.ts
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { processJsonChunk } from './my-json-parser';

export type SLMChunk = { type: 'text'; content: string } | { type: 'json'; content: WorkflowStep };

// export type SLMOutput = SLMChunk[];

export class SLMOutput {
  private _string: string | null = null;
  private _workflowStep: WorkflowStep | undefined | null = null;
  private _stepString: string | null = null;

  constructor(private readonly chunks: SLMChunk[]) {
  }

  get toReponseString(): string {
    if (this._string === null) {
      this._string = this.chunks
        .map(chunk => {
          if (chunk.type === 'json') {
            return JSON.stringify(chunk.content, null, 2);
          }
          return chunk.content;
        })
        .join('\n\n');
    }
    return this._string;
  }

  get toWorkflowStep(): WorkflowStep | undefined {
    if (this._workflowStep === null) {
      const firstJson = this.chunks.find(chunk => chunk.type === 'json');
      this._workflowStep = firstJson ? (firstJson.content as WorkflowStep) : undefined;
    }
    return this._workflowStep;
  }

  get toStepString(): string {
    if (this._stepString === null) {
      const step = this.toWorkflowStep;
      this._stepString = step ? JSON.stringify(step, null, 2) : '';
    }
    return this._stepString;
  }

  get Chunks(): SLMChunk[] {
    return [...this.chunks];
  }
}

export type WorkflowMultiStep = SLMOutput[];

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
    return new SLMOutput([]);
  }

  const chunks: SLMChunk[] = [];
  let currentIndex = 0;

  // Handle code fence blocks
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
      chunks.push(processJsonChunk({ type: 'text', content: textBefore }));
    }

    // Add the code fence content as a chunk
    const codeFenceContent = codeFenceMatch[1].trim();
    chunks.push(processJsonChunk({ type: 'text', content: codeFenceContent }));

    currentIndex = matchEnd;
  }

  // Add any remaining text after the last code fence
  const remainingRanges = getUnprocessedRanges(input.length, processedRanges);

  for (const [start, end] of remainingRanges) {
    const text = input.substring(start, end).trim();
    if (text) {
      chunks.push(processJsonChunk({ type: 'text', content: text }));
    }
  }

  return new SLMOutput(chunks);
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
