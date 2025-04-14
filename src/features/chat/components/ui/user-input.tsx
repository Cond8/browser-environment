// src/features/chat/components/ui/user-input.tsx
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/features/chat/store/chat-store';
import { WorkflowValidationError } from '@/features/ollama-api/streaming/api/workflow-chain';
import { useStreamSourceStore } from '@/features/ollama-api/streaming/infra/stream-source-store';
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
  const isLoading = useStreamSourceStore(state => state.isStreaming);
  const setIsLoading = useStreamSourceStore(state => state.setIsStreaming);
  const startWorkflowChain = useStreamSourceStore(state => state.startWorkflowChain);
  const stopLoading = useAbortEventBusStore(state => state.triggerAbort);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    addUserMessage(trimmed);
    setMessage('');
    try {
      const result = await startWorkflowChain();

      // Check if there was an error returned
      if (result.error) {
        console.error('Workflow chain error:', result.error);

        // Get the current message ID to attach the error to
        const currentThread = useChatStore.getState().getCurrentThread();
        if (currentThread && currentThread.messages.length > 0) {
          const lastMessageId = currentThread.messages[currentThread.messages.length - 1].id;

          // Set error on the message
          useChatStore.getState().setMessageError(lastMessageId, {
            message: result.error.message,
            type: result.error.name || 'WorkflowChainError',
            details: {
              phase: result.error.phase,
              context: result.error.context,
              validationErrors:
                result.error instanceof WorkflowValidationError
                  ? result.error.validationErrors
                  : undefined,
            },
          });
        }
      }
    } catch (error) {
      console.error('Unexpected error during workflow chain:', error);
    } finally {
      setIsLoading(false);
    }
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
