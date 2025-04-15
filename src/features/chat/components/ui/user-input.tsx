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
  'Create a workflow to process uploaded CSV files and return a summary of valid rows only',
  'I want a workflow that takes a list of image URLs and returns a compressed preview gallery',
  'Build a workflow that converts raw sensor logs into a daily performance report',
  'I need a workflow that parses and scores form submissions based on completeness and input quality',
  'Create a workflow to validate and summarize expenses from uploaded receipts',
  'I want a workflow that transforms an XML feed into a usable dashboard-ready JSON format',
  'Design a workflow that verifies coupon codes and filters valid ones based on expiration and usage',
  'I need a workflow that fetches product data, applies tax rules, and returns a checkout-ready cart',
  'Build a workflow that takes Git commit messages and returns categorized change summaries',
  'Create a workflow that processes uploaded CSVs, flags duplicates, and returns a clean dataset',
  'I want a workflow that takes an email list, checks for syntax errors, deduplicates, and outputs a clean list',
  'Design a workflow to process server logs and highlight unusual patterns or high-traffic periods',

  // AI-required tasks
  'I want a workflow that reviews customer feedback and returns the top concerns in bullet points',
  'Create a workflow that reads job applications and flags the most relevant candidates for a role',
  'I need a workflow that takes vague bug reports and groups them by likely root cause',
  'Build a workflow that rewrites unclear instructions into consistent user-friendly text',
  'I want a workflow that reads support chat logs and summarizes sentiment trends per product',
  'Create a workflow to process survey responses and identify recurring themes or issues',
  'Design a workflow that audits internal documentation and suggests areas for improvement',
  'I need a workflow that turns meeting transcripts into clear, actionable summaries',
  'Build a workflow to detect potentially biased language in marketing copy and suggest revisions',
  'I want a workflow that scans user bios and suggests role-specific profile improvements',
  'Create a workflow that interprets free-text feature requests and classifies them by urgency and type',
  'Design a workflow that analyzes tone in outreach emails and recommends adjustments for better engagement',
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
              metadata: result.error.metadata,
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
