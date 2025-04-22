// src/features/chat/models/streaming-assistant-message.ts
import { useRetryEventBusStore } from '@/features/ollama-api/stores/retry-event-bus-store';
import { MAX_RETRY_ERROR } from '@/features/ollama-api/streaming-logic/infra/retryable-async-generator';
import { WorkflowPhase } from '@/features/ollama-api/streaming-logic/phases/types';
import { AssistantMessage } from './assistant-message';

export class StreamingAssistantMessage extends AssistantMessage {
  private currentContent: string = '';
  private _rawChunks: string[] = [];

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
   * Attempts to parse content without throwing errors
   */
  private tryParseContentSilently() {
    this._rawChunks = [this.currentContent];

    // Don't attempt parsing if content is empty or not a string
    if (typeof this.currentContent !== 'string' || !this.currentContent.trim()) {
      return;
    }

    // For streaming content, we only need to check if it looks like JSON
    // and store it in the interface response
    if (this.currentContent.includes('{') && this.currentContent.includes('"')) {
      this.addInterfaceResponse(this.currentContent);
    }
  }

  /**
   * Attempts to repair and parse partial JSON from the current content stream
   */
  tryParseContent(phase: WorkflowPhase = 'step'): void {
    // Skip parsing for alignment phase as it returns markdown
    if (phase === 'alignment') {
      return;
    }

    // For streaming content, we only need to validate JSON when we have a complete object
    if (this.currentContent.includes('{') && this.currentContent.includes('}')) {
      try {
        JSON.parse(this.currentContent);
      } catch (e: unknown) {
        console.log('Triggering retry for JSON parsing error', (e as Error).message);
        const canRetry = useRetryEventBusStore.getState().triggerRetry(phase, (e as Error).message);
        if (!canRetry) {
          throw new Error(MAX_RETRY_ERROR);
        }
        throw e;
      }
    }
  }

  override get content(): string {
    return this.currentContent;
  }

  override get rawChunks(): string[] {
    return this._rawChunks;
  }

  /**
   * Creates a new StreamingAssistantMessage with updated content
   */
  static fromContent(content: string): StreamingAssistantMessage {
    return new StreamingAssistantMessage(content);
  }
}
