// src/features/ollama-api/streaming-logic/api/workflow-chain.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { UserMessage } from '@/features/chat/models/message';
import { useChatStore } from '../../../chat/store/chat-store';
import {
  retryableAsyncGenerator,
  RetryableGeneratorOptions,
} from '../infra/retryable-async-generator';
import { alignmentPhase } from '../phases/alignment-phase';
import { interfacePhase } from '../phases/interface-phase';
import { firstStepPhase } from '../phases/steps/step-1-phase';
import { secondStepPhase } from '../phases/steps/step-2-phase';
import { thirdStepPhase } from '../phases/steps/step-3-phase';
import { UserRequest, WorkflowPhase } from '../phases/types';
import { useEditorStore } from '@/features/editor/stores/editor-store';
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { validateWorkflowStep } from '@/features/editor/transpilers-json-source/workflow-step-validator';

function pushStepToEditorStore(step: string) {
  const editorStore = useEditorStore.getState();
  const validated = validateWorkflowStep(processJsonChunk(step));
  const currentContent = editorStore.content || [];
  editorStore.setContent([...currentContent, validated]);
}


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
  const chatStore = useChatStore.getState();
  const messages = chatStore.getAllMessages();

  if (messages.length > 1) {
    throw new WorkflowChainError('Only one message is supported', 'stream', undefined, {
      messageCount: messages.length,
    });
  }

  const userMessage = messages[0] as UserMessage;
  const userRequest = userMessage.content;
  const userReq: UserRequest = {
    userRequest: typeof userRequest === 'string' ? userRequest : JSON.stringify(userRequest),
  };

  const assistantMessage = new AssistantMessage();

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

  try {
    /* ============================
     * ===== ALIGNMENT PHASE =====
     * ============================ */
    console.log('alignmentPhase');
    const alignmentResult = yield* retryableAsyncGenerator(
      () => alignmentPhase(userReq),
      retryOptions,
    );
    console.log('alignmentResult', { alignmentResult });
    assistantMessage.addAlignmentResponse(alignmentResult);

    /* =============================
     * ===== INTERFACE PHASE ======
     * ============================= */
    console.log('interfacePhase');
    const interfaceResult = yield* retryableAsyncGenerator(
      () => interfacePhase(userReq, assistantMessage),
      retryOptions,
    );
    assistantMessage.addInterfaceResponse(interfaceResult);
    pushStepToEditorStore(interfaceResult);

    /* ===========================
     * ===== ENRICH STEP ========
     * =========================== */
    console.log('firstStepPhase (enrich)');
    const enrichStep = yield* retryableAsyncGenerator(
      () => firstStepPhase(userReq, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepEnrichResponse(enrichStep);
    pushStepToEditorStore(enrichStep);

    /* ==========================
     * ===== LOGIC STEP ========
     * ========================== */
    console.log('secondStepPhase (logic)');
    const logicStep = yield* retryableAsyncGenerator(
      () => secondStepPhase(userReq, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepLogicResponse(logicStep);
    pushStepToEditorStore(logicStep);

    /* ============================
     * ===== FORMAT STEP =========
     * ============================ */
    console.log('thirdStepPhase (format)');
    const formatStep = yield* retryableAsyncGenerator(
      () => thirdStepPhase(userReq, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepFormatResponse(formatStep);
    pushStepToEditorStore(formatStep);

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
