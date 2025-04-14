// src/features/chat/components/ui/user-input.tsx
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/features/chat/store/chat-store';
import { useConnStore } from '@/features/ollama-api/store/conn-store';
import { Send, StopCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAbortEventBusStore } from '../../store/abort-eventbus-store';
import { SelectedModel } from './selected-model';
import { ShortcutsDisplay } from './shortcuts-display';

const EXAMPLE_REQUESTS = [
  // Offline tasks
  'Create a function that generates random passwords with specific requirements',
  'Design a database schema for a social media platform',
  'Write a script to analyze website performance metrics',
  'Design a REST API for a todo list application',
  'Design a caching strategy for a high-traffic web application',
  'Write a script to automate file organization on my computer',
  'Create a data visualization dashboard for sales metrics',
  'Design a microservices architecture for a food delivery app',
  'Write a function to validate and sanitize user input',
  'Design a system to handle real-time notifications',

  // AI-required tasks
  'I want to classify emails as spam or not spam',
  'Create a machine learning model to predict housing prices',
  'Write a function to detect anomalies in time series data',
  'Create a recommendation system for an e-commerce website',
  'Create a chatbot that can answer customer support questions',
  'Analyze this code and suggest improvements for better performance',
  'Explain the differences between various machine learning algorithms',
  'Help me debug this complex multi-threaded application',
  'Suggest the best architecture for a real-time collaborative editor',
  'Review this security implementation and identify potential vulnerabilities',
];

export function UserInput() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Set a random example request when component mounts
    const randomIndex = Math.floor(Math.random() * EXAMPLE_REQUESTS.length);
    setMessage(EXAMPLE_REQUESTS[randomIndex]);
  }, []);

  const addUserMessage = useChatStore(state => state.addUserMessage);
  const triggerAbort = useAbortEventBusStore(state => state.triggerAbort);
  const isLoading = useConnStore(state => state.isLoading);
  const setIsLoading = useConnStore(state => state.setIsLoading);
  const startWorkflowChain = useConnStore(state => state.startWorkflowChain);
  const stopLoading = useAbortEventBusStore(state => state.triggerAbort);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    addUserMessage(trimmed);
    setMessage('');
    await startWorkflowChain();
    setIsLoading(false);
  };

  const handleButtonSubmit = () => {
    console.log('[UserInput] Button submit triggered');
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();
      if (!isLoading) {
        handleSubmit(e);
      }
    }
  };

  const handleStop = () => {
    console.log('[UserInput] Stop button clicked');
    triggerAbort();
    stopLoading();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 border-t">
      <Textarea
        value={message}
        onChange={e => {
          setMessage(e.target.value);
        }}
        placeholder="Type your message..."
        className="min-h-[60px] resize-none"
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />
      <div className="flex items-center justify-between">
        <SelectedModel />
        <div className="flex items-center gap-2">
          <ShortcutsDisplay
            command="Stop"
            shortcut="Shift+Enter"
            asButton
            onClick={handleStop}
            hide={!isLoading}
            icon={StopCircle}
          />
          <ShortcutsDisplay
            command="Send"
            shortcut="Shift+Enter"
            asButton
            onClick={handleButtonSubmit}
            hide={isLoading}
            icon={Send}
          />
        </div>
      </div>
    </form>
  );
}
