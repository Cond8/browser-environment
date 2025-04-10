import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, Message } from '../stores/chat-store';
import { useWorkflowStore } from '../stores/workflow-store';
import { sendMessage } from '../services/chat-service';
import { MonacoEditor } from '../../../components/editor/monaco-editor';
import { Card } from '../../../components/ui/card';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`flex gap-3 max-w-[85%] ${message.role === 'assistant' ? 'self-start' : 'self-end flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        message.role === 'assistant' 
          ? 'bg-muted text-muted-foreground' 
          : 'bg-primary text-primary-foreground'
      }`}>
        {message.role === 'assistant' ? 'AI' : 'You'}
      </div>
      <div className={`p-3 rounded-lg ${
        message.role === 'assistant'
          ? 'bg-muted text-muted-foreground rounded-tl-none'
          : 'bg-primary text-primary-foreground rounded-tr-none'
      }`}>
        {message.content}
      </div>
    </div>
  );
};

const ChatInput: React.FC<{
  onSend: (message: string) => Promise<void>;
  isLoading: boolean;
}> = ({ onSend, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      await onSend(inputValue);
      setInputValue('');
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form className="flex gap-2 p-4 border-t" onSubmit={handleSubmit}>
      <Textarea
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        disabled={isLoading}
        className="min-h-[24px] max-h-[150px] resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <Button 
        type="submit" 
        disabled={!inputValue.trim() || isLoading}
        className="self-end"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </Button>
    </form>
  );
};

export const ChatInterface: React.FC = () => {
  const { conversations, currentConversationId, isLoading, createConversation } = useChatStore();
  const { currentAst, currentWorkflow } = useWorkflowStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = currentConversationId ? conversations[currentConversationId]?.messages || [] : [];

  // Create a new conversation if none exists
  useEffect(() => {
    if (!currentConversationId) {
      createConversation();
    }
  }, [currentConversationId, createConversation]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) return;
    
    await sendMessage(content, currentConversationId, {
      useTools: true,
      streaming: true,
      onToken: (token) => {
        // This is handled by the chat store now
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message: Message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      
      {currentAst && (
        <Card className="border-t p-4">
          <h3 className="text-lg font-semibold mb-2">Workflow DSL</h3>
          <MonacoEditor 
            value={currentWorkflow?.dsl || ''}
            height="300px"
            readOnly={true}
          />
        </Card>
      )}
    </div>
  );
}; 