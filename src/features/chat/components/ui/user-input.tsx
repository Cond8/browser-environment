// src/features/chat/components/ui/user-input.tsx
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/features/chat/store/chat-store';
import { useStreamSourceStore } from '@/features/ollama-api/streaming-logic/infra/stream-source-store';
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

  const getRandomExample = () => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_REQUESTS.length);
    return EXAMPLE_REQUESTS[randomIndex];
  };

  useEffect(() => {
    // Set a random example request when component mounts
    setMessage(getRandomExample());
  }, []);

  const addUserMessage = useChatStore(state => state.addUserMessage);
  const addAssistantMessage = useChatStore(state => state.addAssistantMessage);
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
      addAssistantMessage(result);
    } catch (error) {
      console.error('Unexpected error during workflow chain:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonSubmit = () => {
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMessage(getRandomExample())}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            title="Get random example"
          >
            replace
          </Button>
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
