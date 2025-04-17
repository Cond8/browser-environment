// src/features/chat/models/assistant-message.ts
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

export class StreamingAssistantMessage extends AssistantMessage {
  private currentContent: string = '';

  constructor(content?: string) {
    super();
    if (content) {
      this.currentContent = content;
      this.tryParseContent();
    }
  }

  addToken(token: string) {
    this.currentContent += token;
    this.tryParseContent();
    return this;
  }

  /**
   * Attempts to repair and parse partial JSON from the current content stream
   */
  private tryParseContent() {
    // Always update the raw content
    this.rawChunks = [this.currentContent];

    try {
      // First check if we have a complete JSON object
      const jsonMatches = this.currentContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatches) {
        try {
          const parsed = JSON.parse(jsonMatches[1]);
          if (parsed && typeof parsed === 'object') {
            this.addJsonResponse(jsonMatches[1]);
            return;
          }
        } catch (e) {
          // Ignore parse errors for now
        }
      }

      // If no complete JSON block found, look for potential partial JSON
      const potentialJson = this.currentContent.match(/\{[\s\S]*?\}/g);
      if (potentialJson) {
        for (const match of potentialJson) {
          // Only try to parse if it looks like a complete object
          if (match.match(/^{[^{}]*}$/)) {
            try {
              const parsed = JSON.parse(match);
              if (parsed && typeof parsed === 'object') {
                this.addJsonResponse(match);
              }
            } catch (e) {
              // Ignore parse errors for partial objects
            }
          }
        }
      }
    } catch (e) {
      // Silently fail if we can't parse the content yet
      console.debug('Error parsing streaming content:', e);
    }
  }

  override get content(): string {
    return this.currentContent;
  }

  /**
   * Creates a new StreamingAssistantMessage with updated content
   */
  static fromContent(content: string): StreamingAssistantMessage {
    return new StreamingAssistantMessage(content);
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
