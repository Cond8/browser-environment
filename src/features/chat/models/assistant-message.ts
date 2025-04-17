import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { nanoid } from 'nanoid';
import { ToolCall } from 'ollama';
import { AssistantMessage as BaseAssistantMessage } from './message';

export class AssistantMessage implements BaseAssistantMessage {
  id: string;
  role: 'assistant' = 'assistant';
  timestamp: number = Date.now();

  rawChunks: string[] = [];

  tool_calls?: ToolCall[];
  images?: Uint8Array[] | string[];
  error?: Error;

  constructor() {
    this.id = nanoid();
  }

  addAlignmentResponse(response: string) {
    this.rawChunks.push(response);
  }

  addInterfaceResponse(response: string) {
    this.rawChunks.push(response);
  }

  addStepResponse(response: string) {
    this.rawChunks.push(response);
  }

  addJsonResponse(response: string) {
    this.rawChunks.push(response);
  }

  setError(error: Error) {
    this.error = error;
  }

  get content(): string {
    return this.rawChunks.join('\n\n');
  }

  get workflow(): WorkflowStep[] {
    return extractWorkflowStepsFromChunks(this.rawChunks);
  }

  get interface(): WorkflowStep {
    return this.workflow[0];
  }

  get interfaceString(): string {
    return JSON.stringify(this.interface, null, 2);
  }

  getStep(num: number): WorkflowStep {
    return this.workflow[num];
  }

  getStepString(num: number): string {
    return JSON.stringify(this.getStep(num), null, 2);
  }

  get steps(): WorkflowStep[] {
    return this.workflow.slice(1);
  }
}

export function extractWorkflowStepsFromChunks(chunks: string[]): WorkflowStep[] {
  const steps: WorkflowStep[] = [];

  for (const chunk of chunks) {
    try {
      const step = processJsonChunk(chunk);
      if (step) steps.push(step);
    } catch (e) {
      console.warn('Skipping non-JSON chunk:', e);
    }
  }

  return steps;
}
