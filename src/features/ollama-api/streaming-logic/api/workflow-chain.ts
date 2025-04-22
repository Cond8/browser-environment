// src/features/ollama-api/streaming-logic/api/workflow-chain.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { UserMessage } from '@/features/chat/models/message';
import { useEditorStore } from '@/features/editor/stores/editor-store';
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { validateWorkflowStep } from '@/features/editor/transpilers-json-source/workflow-step-validator';
import { useChatStore } from '../../../chat/store/chat-store';
import {
  AlignmentResponse,
  AssistantResponse,
  GeneratedStep,
} from '../../prompts/assistant-response';
import { chatFn } from '../infra/create-chat';
import {
  retryableAsyncGenerator,
  RetryableGeneratorOptions,
} from '../infra/retryable-async-generator';
import { ALIGNMENT_MESSAGES } from '../phases/alignment-phase';
import { INTERFACE_MESSAGES } from '../phases/interface-phase';
import { WorkflowPhase, WorkflowStep } from '../phases/types';

export class WorkflowChainError extends Error {
  public metadata: unknown[];
  constructor(
    message: string,
    public phase: 'interface' | 'step' | 'stream' | 'alignment',
    public originalError?: Error,
    ...metadata: unknown[]
  ) {
    super(message);
    this.name = 'WorkflowChainError';
    this.metadata = metadata;
  }
}

export class WorkflowValidationError extends WorkflowChainError {
  constructor(
    message: string,
    phase: WorkflowPhase,
    public validationErrors: string[],
    ...metadata: unknown[]
  ) {
    super(message, phase, undefined, ...metadata);
    this.name = 'WorkflowValidationError';
  }
}

export async function* executeWorkflowChain(): AsyncGenerator<string, AssistantMessage, unknown> {
  // Reset the editor state at the start of the workflow
  useEditorStore.getState().setFilePath(null);

  const chatStore = useChatStore.getState();
  const messages = chatStore.getAllMessages();

  if (messages.length > 1) {
    throw new WorkflowChainError('Only one message is supported', 'stream', undefined, {
      messageCount: messages.length,
    });
  }

  const userMessage = messages[0] as UserMessage;
  const userReq = userMessage.content;

  const assistantMessage = new AssistantMessage();
  const assistantResponse = new AssistantResponse();

  // Create a retry trigger system
  const retryCallbacks: (() => void)[] = [];
  const registerRetryTrigger = (callback: () => void) => {
    retryCallbacks.push(callback);
    return () => {
      const index = retryCallbacks.indexOf(callback);
      if (index !== -1) {
        retryCallbacks.splice(index, 1);
      }
    };
  };

  const retryOptions: RetryableGeneratorOptions = {
    shouldRecover: err => {
      if (err instanceof WorkflowChainError) {
        return err.phase === 'stream';
      }
      return false;
    },
    fallbackValue: acc => acc,
    registerRetryTrigger,
    maxChunkSize: 10_000,
  };

  function pushStepToEditor(step: string): WorkflowStep {
    const editorStore = useEditorStore.getState();
    const validated = validateWorkflowStep(processJsonChunk(step));
    const currentContent = editorStore.content || [];
    editorStore.setContent([...currentContent, validated]);

    return validated;
  }

  try {
    /**============================
     * ===== ALIGNMENT PHASE ======
     * ============================ */
    console.log('alignmentPhase');
    const alignmentResult = yield* retryableAsyncGenerator(
      () => chatFn({ messages: ALIGNMENT_MESSAGES(userReq, assistantResponse) }),
      retryOptions,
    );
    console.log('alignmentResult', { alignmentResult });
    assistantResponse.alignment = new AlignmentResponse(alignmentResult);

    /**=============================
     * ===== INTERFACE PHASE =======
     * ============================= */
    console.log('interfacePhase');
    const interfaceResult = yield* retryableAsyncGenerator(
      () => chatFn({ messages: INTERFACE_MESSAGES(userReq, assistantResponse) }),
      retryOptions,
    );
    assistantResponse.workflowInterface = new GeneratedStep(interfaceResult);
    pushStepToEditor(interfaceResult);

    /**============================
     * ===== LOGIC STEPS LOOP =====
     * ============================ */

    /**===========================
     * ===== END OF WORKFLOW =====
     * =========================== */

    return assistantMessage;
  } catch (error) {
    const err =
      error instanceof WorkflowChainError
        ? error
        : new WorkflowChainError('Unexpected error in workflow chain', 'stream', error as Error);

    assistantMessage.setError(err);
    return assistantMessage;
  }
}
