// src/features/chat/components/assistant-display.tsx
import { Button } from '@/components/ui/button';
import { parseSlm } from '@/features/editor/transpilers-json-source/slm-parser';
import { cn } from '@/lib/utils';
import { Code, MessageSquare } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AssistantMessage } from '../models/assistant-message';
import { markdownComponents } from './markdown-components';
import { WorkflowStepDisplay } from './workflow-step-components';

interface AssistantDisplayProps {
  assistantMessage: AssistantMessage;
  isStreaming?: boolean;
}

const MarkdownRenderer = memo(({ content }: { content: string }) => (
  <div className={cn('prose max-w-none')}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  </div>
));

export const AssistantDisplay = ({
  assistantMessage,
  isStreaming = false,
}: AssistantDisplayProps) => {
  const [showRaw, setShowRaw] = useState(false);

  const parsedSlm = useMemo(() => {
    try {
      return parseSlm(assistantMessage.content ?? '');
    } catch (error) {
      console.error('Error parsing SLM content:', error);
      return { markdown: {}, steps: [] };
    }
  }, [assistantMessage.content]);

  const hasMarkdownSections = !!(
    parsedSlm.markdown.goal ||
    parsedSlm.markdown.inputs ||
    parsedSlm.markdown.outputs ||
    parsedSlm.markdown.plan
  );

  return (
    <div className="overflow-hidden">
      <div className="flex justify-end p-2">
        <Button variant="ghost" size="sm" onClick={() => setShowRaw(!showRaw)} className="gap-2">
          {showRaw ? (
            <>
              <MessageSquare className="h-4 w-4" />
              Show Parsed
            </>
          ) : (
            <>
              <Code className="h-4 w-4" />
              Show Raw
            </>
          )}
        </Button>
      </div>

      {showRaw ? (
        <div className="p-4 bg-muted rounded-lg">
          <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-[500px]">
            {assistantMessage.content}
          </pre>
        </div>
      ) : (
        <div className="space-y-4 px-4">
          {/* Markdown Sections */}
          {hasMarkdownSections && (
            <div className="space-y-4 mb-6">
              {parsedSlm.markdown.goal && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Goal</h3>
                  <MarkdownRenderer content={parsedSlm.markdown.goal} />
                </div>
              )}

              {parsedSlm.markdown.inputs && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Inputs</h3>
                  <MarkdownRenderer content={parsedSlm.markdown.inputs} />
                </div>
              )}

              {parsedSlm.markdown.outputs && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Outputs</h3>
                  <MarkdownRenderer content={parsedSlm.markdown.outputs} />
                </div>
              )}

              {parsedSlm.markdown.plan && parsedSlm.markdown.plan.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Plan</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    {parsedSlm.markdown.plan.map((step, i) => (
                      <li key={i} className="text-sm">
                        <div className="prose">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {step}
                          </ReactMarkdown>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Workflow Steps */}
          {parsedSlm.steps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Workflow Steps</h3>
              <div className="grid gap-3">
                {parsedSlm.steps.map((step, i) => (
                  <div
                    key={i}
                    className={cn(
                      'border rounded-lg overflow-hidden',
                      i === 0 ? 'border-primary bg-primary/5' : 'border-border bg-card',
                    )}
                  >
                    <WorkflowStepDisplay
                      step={step}
                      isInterface={i === 0}
                      isStreaming={isStreaming}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback if no content could be parsed */}
          {!hasMarkdownSections && parsedSlm.steps.length === 0 && (
            <div className="p-4">
              <MarkdownRenderer content={assistantMessage.content ?? ''} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
