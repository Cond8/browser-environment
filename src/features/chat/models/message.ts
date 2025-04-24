// src/features/chat/models/message.ts
import { Message as OllamaMessage } from 'ollama/browser';

export interface Message extends OllamaMessage {
  timestamp: number;
  id: string;
}

export interface UserMessage extends Message {
  role: 'user';
}

export interface AssistantMessage extends Message {
  role: 'assistant';
}

export type ThreadMessage = UserMessage | AssistantMessage;
