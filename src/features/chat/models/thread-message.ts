import { SLMOutput } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { myJsonParser } from '@/features/editor/transpilers-json-source/my-json-parser';
import { nanoid } from 'nanoid';
import { ChatStore } from '../store/chat-store';
// Base interface that both user and assistant messages must implement
export interface BaseThreadMessage {
  id: number;
  role: 'user' | 'assistant';
  type: string;
  getContent(): Promise<string | SLMOutput>;
  getRawContent(): string;
}

// Error interface matching existing structure
export interface MessageError {
  message: string;
  type: string;
  details?: {
    phase?: 'interface' | 'step' | 'stream' | 'alignment';
    validationErrors?: string[];
    metadata?: unknown[];
  };
}

// User message implementation
export class UserMessage implements BaseThreadMessage {
  id: number;
  role: 'user' = 'user';
  type: 'alignment' = 'alignment';
  private content: string;

  constructor(content: string) {
    this.id = parseInt(nanoid(10), 36);
    this.content = content;
  }

  async getContent() {
    return this.content;
  }

  getRawContent() {
    return this.content;
  }
}

// Assistant message implementation
export class AssistantMessage implements BaseThreadMessage {
  id: number;
  role: 'assistant' = 'assistant';
  private rawContent: string[] = []; // Array to store content from different phases
  private _parsedContent: SLMOutput | null = null;
  type: 'alignment' | 'interface' | 'step' = 'alignment'; // Default to alignment
  error?: MessageError;
  private store: ChatStore;

  constructor(store: ChatStore) {
    this.id = parseInt(nanoid(10), 36);
    this.store = store;
    // Add this message to the store immediately
    this.store.addMessage(this);
  }

  // Method to append new content and update store
  appendContent(content: string, type: 'alignment' | 'interface' | 'step'): void {
    this.rawContent.push(content);
    this.type = type; // Update type to reflect latest phase
  }

  // Method to set parsed content and update store
  setParsedContent(content: SLMOutput): void {
    this._parsedContent = content;
  }

  async getContent() {
    if (!this._parsedContent) {
      try {
        if (this.type === 'alignment') {
          // For alignment messages, return the last alignment content
          return this.rawContent[this.rawContent.length - 1] || '';
        } else {
          // For interface and step messages, parse the last content
          const lastContent = this.rawContent[this.rawContent.length - 1] || '';
          this._parsedContent = myJsonParser(lastContent);
        }
      } catch (error) {
        this.setError(error as Error);
        return this.rawContent[this.rawContent.length - 1] || '';
      }
    }
    return this._parsedContent || this.rawContent[this.rawContent.length - 1] || '';
  }

  getRawContent() {
    // Return all content joined with newlines
    return this.rawContent.join('\n\n');
  }

  setError(error: Error | MessageError) {
    if (error instanceof Error) {
      this.error = {
        message: error.message,
        type: error.name,
        details: {
          phase: this.type,
        },
      };
    } else {
      this.error = error;
    }
    // Notify store of error
    this.store.setMessageError(this.id, this.error);
  }

  // Factory method to create a new assistant message
  static create(store: ChatStore) {
    return new AssistantMessage(store);
  }
}
