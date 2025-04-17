// src/features/chat/models/assistant-message.ts
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { createDefaultWorkflowStep } from '@/utils/workflow-helpers';
import { nanoid } from 'nanoid';
import { ToolCall } from 'ollama';
import { AssistantMessage as BaseAssistantMessage } from './message';

export class AssistantMessage implements BaseAssistantMessage {
  id: string;
  role: 'assistant' = 'assistant';
  timestamp: number = Date.now();

  tool_calls?: ToolCall[];
  images?: Uint8Array[] | string[];
  error?: Error;

  _alignmentResponse: string = '';
  _interfaceResponse: string = '';
  _stepEnrichResponse: string = '';
  _stepLogicResponse: string = '';
  _stepFormatResponse: string = '';

  constructor() {
    this.id = nanoid();
  }

  get alignmentResponse(): string {
    return this.rawChunks[0];
  }

  addAlignmentResponse(response: string) {
    this._alignmentResponse = response;
  }

  addInterfaceResponse(response: string) {
    this._interfaceResponse = response;
  }

  addStepEnrichResponse(response: string) {
    this._stepEnrichResponse = response;
  }

  addStepLogicResponse(response: string) {
    this._stepLogicResponse = response;
  }

  addStepFormatResponse(response: string) {
    this._stepFormatResponse = response;
  }

  setError(error: Error) {
    this.error = error;
  }

  get content(): string {
    return this.rawChunks.join('\n\n');
  }

  get rawChunks(): string[] {
    return [
      this._alignmentResponse,
      this._interfaceResponse,
      this._stepEnrichResponse,
      this._stepLogicResponse,
      this._stepFormatResponse,
    ].filter(Boolean);
  }

  set rawChunks(chunks: string[]) {
    this._alignmentResponse = chunks[0];
    this._interfaceResponse = chunks[1];
    this._stepEnrichResponse = chunks[2];
    this._stepLogicResponse = chunks[3];
    this._stepFormatResponse = chunks[4];
  }

  get workflow(): WorkflowStep[] {
    return extractWorkflowStepsFromChunks(this.rawChunks);
  }

  get interface(): WorkflowStep {
    const workflow = this.workflow;
    return workflow.length > 0
      ? workflow[0]
      : createDefaultWorkflowStep(
          'DefaultInterface',
          'empty_interface',
          'Process an empty interface',
        );
  }

  get interfaceString(): string {
    const interfaceObj = this.interface;
    return typeof interfaceObj === 'string' ? interfaceObj : JSON.stringify(interfaceObj, null, 2);
  }

  getStep(num: number): WorkflowStep {
    const workflow = this.workflow;
    if (num < 0 || num >= workflow.length) {
      return createDefaultWorkflowStep(
        'MissingStep',
        'empty_step',
        `Placeholder for missing step ${num}`,
      );
    }
    return workflow[num];
  }

  getStepString(num: number): string {
    const step = this.getStep(num);
    return typeof step === 'string' ? step : JSON.stringify(step, null, 2);
  }

  get steps(): WorkflowStep[] {
    const workflow = this.workflow;
    return workflow.length > 1 ? workflow.slice(1) : [];
  }
}

export function extractWorkflowStepsFromChunks(chunks: string[]): WorkflowStep[] {
  const steps: WorkflowStep[] = [];

  // If we have no chunks, return an empty placeholder step
  if (
    !chunks ||
    chunks.length === 0 ||
    chunks.every(chunk => typeof chunk !== 'string' || !chunk.trim())
  ) {
    return [createDefaultWorkflowStep('EmptyWorkflow', 'process_empty', 'Process empty input')];
  }

  for (const chunk of chunks) {
    // Skip empty chunks or non-string chunks
    if (typeof chunk !== 'string' || !chunk.trim()) continue;

    try {
      // Store the raw JSON string as-is without attempting to parse it
      // This allows UI components to decide how to display it
      const step = processJsonChunk(chunk);

      // Keep the raw chunk as a string if we can't parse it
      if (step) {
        // If step is already parsed, store it as is
        steps.push(step);
      } else if (chunk.includes('{') && chunk.includes('}')) {
        // If it looks like JSON but couldn't be parsed, store the raw string
        // Create a special WorkflowStep that contains the raw string
        steps.push({
          name: 'RawJsonStep',
          module: 'unknown',
          functionName: 'rawJsonData',
          goal: 'Raw JSON data from LLM response',
          params: {},
          returns: {},
          rawContent: chunk,
        } as WorkflowStep);
      }
    } catch (e) {
      console.warn('Skipping non-JSON chunk:', e);

      // If it looks like JSON but couldn't be parsed, store the raw string
      if (chunk.includes('{') && chunk.includes('}')) {
        steps.push({
          name: 'RawJsonStep',
          module: 'unknown',
          functionName: 'rawJsonData',
          goal: 'Raw JSON data from LLM response',
          params: {},
          returns: {},
          rawContent: chunk,
        } as WorkflowStep);
      }
    }
  }

  // If we processed all chunks but got no steps, provide a default
  if (steps.length === 0) {
    return [createDefaultWorkflowStep('DefaultWorkflow', 'process_data', 'Process input data')];
  }

  return steps;
}
