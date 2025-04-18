// src/features/chat/models/message.ts
import { Message as OllamaMessage } from 'ollama/browser';
import { AssistantMessage } from './assistant-message';

export interface Message extends OllamaMessage {
  timestamp: number;
  id: string;
}

export interface UserMessage extends Message {
  role: 'user';
}

export type ThreadMessage = UserMessage | AssistantMessage;
