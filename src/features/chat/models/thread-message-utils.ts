import { SLMOutput } from '@/features/editor/transpilers-json-source/extract-text-parse';
import { AssistantMessage, BaseThreadMessage, UserMessage } from './thread-message';

// Helper to check if object is a BaseThreadMessage
export function isBaseThreadMessage(obj: any): obj is BaseThreadMessage {
  return (
    obj &&
    typeof obj === 'object' &&
    'getContent' in obj &&
    typeof obj.getContent === 'function' &&
    'getRawContent' in obj &&
    typeof obj.getRawContent === 'function'
  );
}

// Helper to check if object is a UserMessage
export function isUserMessage(obj: any): obj is UserMessage {
  return isBaseThreadMessage(obj) && obj.role === 'user';
}

// Helper to check if object is an AssistantMessage
export function isAssistantMessage(obj: any): obj is AssistantMessage {
  return isBaseThreadMessage(obj) && obj.role === 'assistant';
}

// Helper to check if object is an SLMOutput instance
export function isSLMOutputInstance(obj: any): obj is SLMOutput {
  return obj instanceof SLMOutput;
}

// Helper to check if object is a legacy assistant message
export function isLegacyAssistantMessage(obj: any): obj is AssistantMessage {
  return isBaseThreadMessage(obj) && obj.role === 'assistant' && !('setError' in obj);
}

// Get content from any message type
export function getMessageContent(message: BaseThreadMessage | any): string {
  if (isBaseThreadMessage(message)) {
    return message.getRawContent();
  }
  // Handle legacy messages that might not have getRawContent
  if (message && typeof message === 'object') {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (typeof message.rawContent === 'string') {
      return message.rawContent;
    }
  }
  return '';
}

// Get error from any assistant message type
export function getMessageError(message: BaseThreadMessage): any {
  if (isAssistantMessage(message)) {
    return message.error;
  }
  return null;
}
