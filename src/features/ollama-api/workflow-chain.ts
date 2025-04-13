// src/features/ollama-api/workflow-chain.ts
import { useAssistantConfigStore } from '../chat/store/assistant-config-store';
import { useChatStore } from '../chat/store/chat-store';
import { handleAlignmentPhase } from './phases/alignment-phase';
import { handleInterfacePhase } from './phases/interface-phase';
import { WorkflowStep } from './tool-schemas/workflow-schema';

export class WorkflowChainError extends Error {
  constructor(
    message: string,
    public phase: 'interface' | 'steps' | 'stream' | 'alignment',
    public originalError?: Error,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'WorkflowChainError';
  }
}

export class WorkflowValidationError extends WorkflowChainError {
  constructor(
    message: string,
    phase: 'interface' | 'steps' | 'alignment',
    public validationErrors: string[],
    public context?: Record<string, unknown>,
  ) {
    super(message, phase, undefined, context);
    this.name = 'WorkflowValidationError';
  }
}

export async function executeWorkflowChain(): Promise<{
  interface?: WorkflowStep;
  steps?: WorkflowStep[];
  error?: WorkflowChainError;
}> {
  console.log('[WorkflowChain] Starting workflow chain execution');
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();
  console.log('[WorkflowChain] Using model:', selectedModel, 'with parameters:', parameters);

  const chatStore = useChatStore.getState();
  const assistantMessage = chatStore.addEmptyAssistantMessage();
  console.log('[WorkflowChain] Created new assistant message with ID:', assistantMessage.id);

  const messages = chatStore.getMessagesUntil(assistantMessage.id);
  console.log('[WorkflowChain] Retrieved messages:', messages.length);

  if (messages.length > 1) {
    console.error('[WorkflowChain] Error: More than one message found');
    throw new WorkflowChainError('Only one message is supported', 'stream', undefined, {
      messageCount: messages.length,
    });
  }

  const chatFn = createChatFunction(ollamaUrl, selectedModel, parameters);

  try {
    console.log('[WorkflowChain] Starting alignment phase');
    const alignmentResult = await handleAlignmentPhase(
      messages[0].content,
      assistantMessage.id,
      chatFn,
    );
    chatStore.updateAssistantMessage(assistantMessage.id, alignmentResult.response);

    console.log('[WorkflowChain] Starting interface phase');
    const interfaceResult = await handleInterfacePhase(
      messages[0].content,
      assistantMessage.id,
      chatFn,
    );
    chatStore.updateAssistantMessage(
      assistantMessage.id,
      JSON.stringify({ interface: interfaceResult.interface }, null, 2),
    );

    return {
      interface: interfaceResult.interface,
    };
  } catch (error) {
    console.error('[WorkflowChain] Error in workflow chain:', error);
    const err =
      error instanceof WorkflowChainError
        ? error
        : new WorkflowChainError('Unexpected error in workflow chain', 'stream', error as Error);

    const errorContent = JSON.stringify(
      {
        error: err.message,
        phase: err.phase,
        validationErrors: err instanceof WorkflowValidationError ? err.validationErrors : undefined,
      },
      null,
      2,
    );
    console.error('[WorkflowChain] Error content:', errorContent);
    chatStore.updateAssistantMessage(assistantMessage.id, errorContent);

    return { error: err };
  }
}

function createChatFunction(ollamaUrl: string, model: string, parameters: any) {
  return async (request: any) => {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        model,
        options: parameters,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  };
}
