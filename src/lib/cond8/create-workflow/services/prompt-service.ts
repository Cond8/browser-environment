// src/lib/cond8/create-workflow/services/prompt-service.ts
import { Message } from 'ollama';
import { CoreBlueprint } from '../../_core';

export class PromptService extends CoreBlueprint {
  private messages: Set<Message>;

  constructor(key: string) {
    super(key);
    this.messages = new Set();
  }

  System(prompt: string): void {
    const message: Message = {
      role: 'system',
      content: prompt,
    };
    this.messages.add(message);
  }

  User(prompt: string): void {
    const message: Message = {
      role: 'user',
      content: prompt,
    };
    this.messages.add(message);
  }

  Assistant(prompt: string): void {
    const message: Message = {
      role: 'assistant',
      content: prompt,
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
