// src/features/chat/models/assistant-message.ts
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { jsonrepair } from 'jsonrepair';
import { nanoid } from 'nanoid';
import { Message, ToolCall } from 'ollama/browser';

export interface AssistantTextChunk {
  type: 'text';
  content: string;
}

export interface AssistantJsonChunk {
  type: 'json';
  content: string;
}

export type AssistantChunk = AssistantTextChunk | AssistantJsonChunk;

export interface WorkflowStep {
  name: string;
  module: string;
  functionName: string;
  goal: string;
  params: any;
  returns: any;
}

// Assistant message implementation
export class AssistantMessage implements Message {
  private _cachedRawChucksLength = 0;
  private _cachedSteps: WorkflowStep[] = [];

  readonly timestamp: number = Date.now();

  id: number;
  role: 'assistant' = 'assistant';

  rawChunks: string[] = [];

  tool_calls?: ToolCall[];
  images?: Uint8Array[] | string[];

  error?: Error;

  get content(): string {
    // this is going to be a hard one
    // because we need to add the ```json tags whenever a raw chunk is a json
    // we hope that most of the raw chunks have the ```json tags

    return this.rawChunks.join('\n\n');
  }

  constructor() {
    this.id = parseInt(nanoid(10), 36);
  }

  addAlignmentResponse(response: string) {
    this.rawChunks.push(response);
  }

  addInterfaceResponse(response: string) {
    if (this.isParsableJson(response)) {
      this.rawChunks.push(response);
    } else {
      throw new Error('Interface response not found');
    }
  }

  addStepResponse(response: string) {
    if (this.isParsableJson(response)) {
      this.rawChunks.push(response);
    } else {
      throw new Error('Step response not found');
    }
  }

  get workflow(): WorkflowStep[] {
    if (this._cachedRawChucksLength === this.rawChunks.length) {
      return this._cachedSteps;
    }
    const foundSteps = [] as WorkflowStep[];
    for (const chunk of this.rawChunks) {
      if (this.isParsableJson(chunk)) {
        const jsonMatch = chunk.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            const step = processJsonChunk(jsonMatch[1]);
            if (step) {
              foundSteps.push(step);
            }
          } catch (e) {
            console.error('Failed to process JSON chunk:', e);
          }
        }
      }
    }
    this._cachedSteps = foundSteps;
    this._cachedRawChucksLength = this.rawChunks.length;
    return this._cachedSteps;
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

  setError(error: Error) {
    this.error = error;
  }

  private isParsableJson(chunk: string): boolean {
    console.log('isParsableJson', chunk);

    // Check if the chunk contains a JSON code fence
    const hasJsonFence = chunk.includes('```json');
    if (!hasJsonFence) {
      console.log('no JSON code fence found');
      return false;
    }

    // Extract content between code fences
    const jsonMatch = chunk.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      console.log('could not extract JSON from code fence');
      return false;
    }

    try {
      // Use jsonrepair to handle malformed JSON
      const repairedJson = jsonrepair(jsonMatch[1]);
      // Try parsing to validate
      JSON.parse(repairedJson);
      console.log('found valid JSON in code fence');
      return true;
    } catch (e) {
      console.log('JSON is invalid after repair:', e);
      return false;
    }
  }
}
