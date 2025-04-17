// src/features/chat/models/assistant-message.ts
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { useRetryEventBusStore } from '@/features/ollama-api/stores/retry-event-bus-store';
import {
  JSON_PARSE_ERROR,
  MAX_RETRY_ERROR,
} from '@/features/ollama-api/streaming-logic/infra/retryable-async-generator';
import { WorkflowPhase, WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { createDefaultWorkflowStep } from '@/utils/workflow-helpers';
import { nanoid } from 'nanoid';
import { ToolCall } from 'ollama';
import { AssistantMessage as BaseAssistantMessage } from './message';

// Constants for content analysis thresholds
const INTERFACE_PHASE_CONTENT_THRESHOLD = 100;
const STEP_PHASE_CONTENT_THRESHOLD = 100;
const SHORT_CONTENT_THRESHOLD = 20;

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
        // continue - partial JSON in code blocks is fine during streaming
      }
    }

    // Try parsing standalone JSON objects - be more lenient when looking for JSON
    const potentialJson = content.match(/\{[\s\S]*?\}/g);
    if (potentialJson) {
      for (const match of potentialJson) {
        try {
          const parsed = JSON.parse(match);
          if (parsed && typeof parsed === 'object') {
            this.addJsonResponse(match);
            return true;
          }
        } catch (e) {
          // continue - it's normal to have partial JSON during streaming
        }
      }
    }

    // Check if we have what looks like the start of JSON
    if (content.includes('{') && content.includes('"')) {
      // This is likely JSON being streamed - don't mark as error
      return true;
    }

    return false;
  }

  /**
   * Attempts to parse content without throwing errors
   */
  private tryParseContentSilently() {
    this.rawChunks = [this.currentContent];
    this.parseError = null;

    // Don't attempt parsing if content is empty or not a string
    if (typeof this.currentContent !== 'string' || !this.currentContent.trim()) {
      return;
    }

    try {
      // During streaming, be more lenient with JSON parsing
      if (!this.tryParseJson(this.currentContent)) {
        // Check if content seems to be partially streamed JSON
        const hasJsonStart = this.currentContent.includes('{');
        const hasJsonQuotes = this.currentContent.includes('"');
        const isPartialJson = hasJsonStart && hasJsonQuotes;

        // Only set an error if it doesn't look like partial JSON
        if (!isPartialJson) {
          this.parseError = new Error(JSON_PARSE_ERROR);
        }
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
    // Skip parsing for alignment phase as it returns markdown
    if (phase === 'alignment') {
      return;
    }

    // During interface phase initial streaming, be more lenient
    if (phase === 'interface' && this.currentContent.length < INTERFACE_PHASE_CONTENT_THRESHOLD) {
      // For short content in the interface phase, only raise error on obvious problems
      if (
        this.parseError &&
        !this.currentContent.includes('{') &&
        this.currentContent.length > SHORT_CONTENT_THRESHOLD
      ) {
        throw this.parseError;
      }
      return;
    }

    // During step phase streaming, be more lenient until we have more content
    if (phase === 'step') {
      // Only throw if we have enough content AND it looks like invalid JSON
      const hasJsonMarkers = this.currentContent.includes('{') && this.currentContent.includes('"');
      const hasCompleteJsonObject = this.currentContent.includes('}');

      // If we have what looks like a complete JSON object or enough content, then check for errors
      if (
        hasJsonMarkers &&
        hasCompleteJsonObject &&
        this.currentContent.length > STEP_PHASE_CONTENT_THRESHOLD
      ) {
        if (this.parseError) {
          const canRetry = useRetryEventBusStore
            .getState()
            .triggerRetry(phase, this.parseError.message);
          if (!canRetry) {
            throw new Error(MAX_RETRY_ERROR);
          }
          throw this.parseError;
        }
      } else {
        // Still streaming partial content, don't throw
        return;
      }
    } else if (this.parseError) {
      // For other phases, use the standard error handling
      const canRetry = useRetryEventBusStore
        .getState()
        .triggerRetry(phase, this.parseError.message);
      if (!canRetry) {
        throw new Error(MAX_RETRY_ERROR);
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

  /**
   * Converts the StreamingAssistantMessage to a final AssistantMessage instance
   * This ensures proper object identity for storage in state
   */
  toFinalMessage(): AssistantMessage {
    const finalMessage = new AssistantMessage();

    // Transfer all important properties
    finalMessage.id = this.id;
    finalMessage.timestamp = this.timestamp;

    // Copy the raw chunks
    if (this.rawChunks && this.rawChunks.length > 0) {
      finalMessage.rawChunks = [...this.rawChunks];
    } else if (this.currentContent) {
      // If no raw chunks but we have content, add it as a chunk
      finalMessage.rawChunks = [this.currentContent];
    }

    // Copy other properties if they exist
    if (this.tool_calls) finalMessage.tool_calls = this.tool_calls;
    if (this.images) finalMessage.images = this.images;
    if (this.error) finalMessage.error = this.error;

    return finalMessage;
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
