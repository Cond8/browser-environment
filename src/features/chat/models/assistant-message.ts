// src/features/chat/models/assistant-message.ts
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { useRetryEventBusStore } from '@/features/ollama-api/stores/retry-event-bus-store';
import { WorkflowPhase, WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
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
  private parseError: Error | null = null;

  constructor(content?: string) {
    super();
    if (content) {
      this.currentContent = content;
      this.tryParseContentSilently();
    }
  }

  addToken(token: string) {
    this.currentContent += token;
    this.tryParseContentSilently();
    return this;
  }

  /**
   * Attempts to parse JSON from various formats in the content
   */
  private tryParseJson(content: string): boolean {
    // Try parsing JSON from markdown code blocks
    const jsonBlockMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonBlockMatch) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1]);
        if (parsed && typeof parsed === 'object') {
          this.addJsonResponse(jsonBlockMatch[1]);
          return true;
        }
      } catch (e) {
        // continue
      }
    }

    // Try parsing standalone JSON objects
    const potentialJson = content.match(/\{[\s\S]*?\}/g);
    if (potentialJson) {
      for (const match of potentialJson) {
        if (match.match(/^{[^{}]*}$/)) {
          try {
            const parsed = JSON.parse(match);
            if (parsed && typeof parsed === 'object') {
              this.addJsonResponse(match);
              return true;
            }
          } catch (e) {
            // continue
          }
        }
      }
    }

    return false;
  }

  /**
   * Attempts to parse content without throwing errors
   */
  private tryParseContentSilently() {
    this.rawChunks = [this.currentContent];
    this.parseError = null;

    try {
      if (!this.tryParseJson(this.currentContent)) {
        this.parseError = new Error('Failed to parse JSON content');
      }
    } catch (e) {
      this.parseError = e instanceof Error ? e : new Error('Unknown parsing error');
    }
  }

  /**
   * Attempts to repair and parse partial JSON from the current content stream
   * This is called from within the async generator
   */
  tryParseContent(phase: WorkflowPhase = 'step'): void {
    if (this.parseError) {
      const canRetry = useRetryEventBusStore
        .getState()
        .triggerRetry(phase, this.parseError.message);
      if (!canRetry) {
        throw new Error('Max retry attempts reached for JSON parsing');
      }
      throw this.parseError;
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
