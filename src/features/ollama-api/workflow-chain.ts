// src/features/chat/ollama-api/workflow-chain.ts
import { useAssistantConfigStore } from '../chat/store/assistant-config-store';
import { useChatStore } from '../chat/store/chat-store';
import { handleAlignmentPhase } from './phases/alignment-phase';
import { handleInterfacePhase } from './phases/interface-phase';
import { createStreamResponse, StreamYield } from './stream-response';

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

export async function* streamWorkflowChain(): AsyncGenerator<StreamYield, void, unknown> {
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

  const streamResponse = createStreamResponse(ollamaUrl, selectedModel, parameters);
  // let interfaceParsed: WorkflowStep | null = null;
  // let stepsParsed: WorkflowStep[] | null = null;

  try {
    console.log('[WorkflowChain] Starting alignment phase');
    yield* handleAlignmentPhase(messages[0].content, assistantMessage.id, streamResponse);

    console.log('[WorkflowChain] Starting interface phase');
    const interfaceResult = yield* handleInterfacePhase(
      messages[0].content,
      assistantMessage.id,
      streamResponse,
    );
    // interfaceParsed = interfaceResult;
    // console.log('[WorkflowChain] Interface phase completed:', interfaceResult);

    // console.log('[WorkflowChain] Starting steps phase');
    // const stepsResult = yield* handleStepsPhase(
    //   messages[0].content,
    //   assistantMessage.id,
    //   interfaceResult,
    //   streamResponse,
    //   selectedModel,
    //   parameters,
    // );
    // stepsParsed = stepsResult;
    // console.log('[WorkflowChain] Steps phase completed:', stepsResult);

    // const combinedWorkflow = { interface: interfaceParsed, steps: stepsParsed };
    // const finalContent = JSON.stringify(combinedWorkflow, null, 2);
    // console.log('[WorkflowChain] Updating assistant message with final content');
    // chatStore.updateAssistantMessage(assistantMessage.id, finalContent);
  } catch (error) {
    console.error('[WorkflowChain] Error in workflow chain:', error);
    const err =
      error instanceof WorkflowChainError
        ? error
        : new WorkflowChainError('Unexpected error in workflow chain', 'stream', error as Error);

    yield { type: 'error', error: err, id: assistantMessage.id };

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

    throw err;
  }
}
