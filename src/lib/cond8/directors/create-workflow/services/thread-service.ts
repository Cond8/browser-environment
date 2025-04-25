// src/lib/cond8/create-workflow/services/prompt-service.ts
import { AssistantMessage, UserMessage } from '@/features/chat/models/message';
import { useChatStore } from '@/features/chat/store/chat-store';
import { CoreBlueprint } from '../../../_core';

export class ThreadService extends CoreBlueprint {
  private source = useChatStore.getState();

  constructor() {
    super('thread');
  }

  User(content: string): void {
    this.source.addUserMessage(content);
  }

  Assistant(content: string): void {
    this.source.addAssistantMessage(content);
  }

  /**
   * Outputs the entire thread as an array of messages in order of receival.
   */
  getThread(): (UserMessage | AssistantMessage)[] {
    return this.source.getCurrentThread()?.messages || [];
  }

  get readonly(): (UserMessage | AssistantMessage)[] {
    return this.getThread();
  }
}
