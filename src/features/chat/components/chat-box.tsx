// src/features/chat/components/chat-box.tsx
import React, { useState } from 'react';
import { ChatService } from '../services/chat-service';
import { useChatStore } from '../store/chat-store';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useOllamaStore } from '../store/ollama-store';

export function ChatBox() {
  const [input, setInput] = useState('');
  const { threads, currentThreadId, isStreaming } = useChatStore();
  const { ollamaUrl } = useOllamaStore();
  const { selectedModel } = useAssistantConfigStore();
  
  const chatService = ChatService.getInstance();
  
  const currentThread = threads.find(t => t.id === currentThreadId);
  const messages = currentThread?.messages || [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isStreaming) return;
    
    const message = input.trim();
    setInput('');
    
    await chatService.sendMessage(message);
  };

  const handleStopGeneration = () => {
    chatService.stopStreaming();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 text-sm text-gray-600 bg-gray-100 border-b">
        Connected to: {ollamaUrl} | Model: {selectedModel || 'Default'}
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`${
              message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
            } p-3 rounded-lg max-w-md ${
              message.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
          >
            <div className="text-xs text-gray-500 mb-1">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t flex">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={handleStopGeneration}
            className="px-4 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
} 