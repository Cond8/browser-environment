// src/features/ollama-api/workflow-chain.ts
import { useAssistantConfigStore } from '../chat/store/assistant-config-store';
import { useChatStore } from '../chat/store/chat-store';
import { useEditorStore } from '../editor/stores/editor-store';
import { useVfsStore } from '../vfs/store/vfs-store';
import { handleAlignmentPhase } from './phases/alignment-phase';
import { handleInterfacePhase } from './phases/interface-phase';
import { handleStepsPhase } from './phases/steps-phase';
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

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function retryWithDelay<T>(
  fn: () => Promise<T>,
  phase: 'interface' | 'steps' | 'stream' | 'alignment',
  context?: Record<string, unknown>,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[WorkflowChain] ${phase} phase attempt ${attempt}/${MAX_RETRIES} failed:`,
        error,
      );

      if (attempt < MAX_RETRIES) {
        console.log(`[WorkflowChain] Retrying ${phase} phase in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw new WorkflowChainError(`Failed after ${MAX_RETRIES} attempts`, phase, lastError, context);
}

export async function executeWorkflowChain(): Promise<{
  interface?: WorkflowStep;
  steps?: WorkflowStep[];
  error?: WorkflowChainError;
}> {
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();

  const chatStore = useChatStore.getState();
  const messages = chatStore.getAllMessages();

  if (messages.length > 1) {
    throw new WorkflowChainError('Only one message is supported', 'stream', undefined, {
      messageCount: messages.length,
    });
  }

  const chatFn = createChatAsyncFunction(ollamaUrl, selectedModel, parameters);

  try {
    /* ===========================
     * ===== ALIGNMENT PHASE =====
     * ===========================*/
    const alignmentResult = await retryWithDelay(
      () => handleAlignmentPhase(messages[0].content, chatFn),
      'alignment',
      { userRequest: messages[0].content },
    );
    chatStore.addAlignmentMessage(alignmentResult.response);

    /* ===========================
     * ===== INTERFACE PHASE =====
     * ===========================*/
    const interfaceResult = await retryWithDelay(
      () => handleInterfacePhase(messages[0].content, alignmentResult.response, chatFn),
      'interface',
      {
        userRequest: messages[0].content,
        alignmentResponse: alignmentResult.response,
      },
    );
    chatStore.addInterfaceMessage(interfaceResult.interface);
    const workflowPath = useVfsStore.getState().createWorkflow(interfaceResult.interface);
    useEditorStore.getState().setActiveEditor(workflowPath);

    /* =======================
     * ===== STEPS PHASE =====
     * =======================*/
    const stepsResult = await retryWithDelay(
      () =>
        handleStepsPhase(
          messages[0].content,
          alignmentResult.response,
          interfaceResult.interface,
          chatFn,
        ),
      'steps',
      {
        userRequest: messages[0].content,
        alignmentResponse: alignmentResult.response,
        interface: interfaceResult.interface,
      },
    );
    chatStore.addStepsMessage(stepsResult.steps);
    useVfsStore.getState().addStepsToWorkflow(workflowPath, stepsResult.steps);
    // useVfsStore.getState().upsertServices(stepsResult.steps);

    return {
      interface: interfaceResult.interface,
      steps: stepsResult.steps,
    };
  } catch (error) {
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

    return { error: err };
  }
}

function createChatAsyncFunction(ollamaUrl: string, model: string, parameters: any) {
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
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  };
}
