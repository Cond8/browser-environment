// src/lib/cond8/create-workflow/services/prompt-service.ts
import { Message } from 'ollama';
import { CoreBlueprint } from '../../_core';

export class ThreadService extends CoreBlueprint {
  private messages: Set<Message>;

  constructor(key: string) {
    super(key);
    this.messages = new Set();
  }

  System(content: string): void {
    const message: Message = {
      role: 'system',
      content,
    };
    this.messages.add(message);
  }

  User(content: string): void {
    const message: Message = {
      role: 'user',
      content,
    };
    this.messages.add(message);
  }

  Assistant(content: string): void {
    const message: Message = {
      role: 'assistant',
      content,
    };
    this.messages.add(message);
  }

  /**
   * Outputs the entire thread as an array of messages in order of receival.
   */
  getThread(): Message[] {
    return Array.from(this.messages);
  }

  get readonly(): Message[] {
    return this.getThread();
  }
}
