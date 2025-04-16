import { nanoid } from 'nanoid';
import { Message, ToolCall } from 'ollama';

export interface AssistantTextChunk {
  type: 'text';
  content: string;
}

export interface AssistantJsonChunk {
  type: 'json';
  content: string;
}

export type AssistantChunk = AssistantTextChunk | AssistantJsonChunk;

export interface WorkFlowStep {
  name: string;
  module: string;
  functionName: string;
  goal: string;
  params: any;
  returns: any;
}

// Assistant message implementation
export class AssistantMessage implements Message {
  private _cachedSteps: WorkFlowStep[] = [];

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
    const content = this.rawChunks.map(chunk => {
      if (this.isJson(chunk)) {
        return `\n\n\`\`\`json\n${chunk}\n\`\`\`\n\n`;
      }
      return chunk;
    });
    return content.join('\n\n');
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

  get workflow(): WorkFlowStep[] {
    if (this._cachedSteps.length === this.rawChunks.length) {
      return this._cachedSteps;
    }
    const foundSteps = [] as WorkFlowStep[];
    for (const chunk of this.rawChunks) {
      const foundStep = chunk.match(/```json\n(.*)\n```/);
      if (foundStep) {
        foundSteps.push(JSON.parse(foundStep[1]));
      }
    }
    this._cachedSteps = foundSteps;
    return this._cachedSteps;
  }

  get interface(): WorkFlowStep {
    return this.workflow[0];
  }

  get interfaceString(): string {
    return JSON.stringify(this.interface, null, 2);
  }

  getStep(num: number): WorkFlowStep {
    return this.workflow[num];
  }

  getStepString(num: number): string {
    return JSON.stringify(this.getStep(num), null, 2);
  }

  get steps(): WorkFlowStep[] {
    return this.workflow.slice(1);
  }

  setError(error: Error) {
    this.error = error;
  }

  private isJson(chunk: string): boolean {
    try {
      JSON.parse(chunk);

      return true;
    } catch (e) {}
    return false;
  }

  private isParsableJson(chunk: string): boolean {
    console.log('isParsableJson', chunk);
    try {
      JSON.parse(chunk);
      console.log('chunk can be parsed immediately');
      return true;
    } catch (e) {
      console.log('chunk cannot be parsed immediately');
    }

    if (this.hasParsableJson(chunk)) {
      return true;
    }

    console.log('no parsable json found');
    return false;
  }

  private hasParsableJson(chunk: string): boolean {
    console.log('hasParsableJson', chunk, !!chunk.match(/```json\n(.*)\n```/));
    return !!chunk.includes('```json');
  }
}
