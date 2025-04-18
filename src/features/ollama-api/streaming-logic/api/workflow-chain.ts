// src/features/ollama-api/streaming-logic/api/workflow-chain.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { UserMessage } from '@/features/chat/models/message';
import { useEditorStore } from '@/features/editor/stores/editor-store';
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { validateWorkflowStep } from '@/features/editor/transpilers-json-source/workflow-step-validator';
import { useChatStore } from '../../../chat/store/chat-store';
import { useVFSStore } from '../../../vfs/store/vfs-store';
import {
  retryableAsyncGenerator,
  RetryableGeneratorOptions,
} from '../infra/retryable-async-generator';
import { alignmentPhase } from '../phases/alignment-phase';
import { interfacePhase } from '../phases/interface-phase';
import { generateEnrichFunction } from '../phases/js/step-1-code';
import { generateAnalyzeFunction } from '../phases/js/step-2-code';
import { generateDecideFunction } from '../phases/js/step-3-code';
import { generateFormatFunction } from '../phases/js/step-4-code';
import { firstStepPhase } from '../phases/steps/step-1-phase';
import { secondStepPhase } from '../phases/steps/step-2-phase';
import { thirdStepPhase } from '../phases/steps/step-3-phase';
import { fourthStepPhase } from '../phases/steps/step-4-phase';
import { UserRequest, WorkflowPhase, WorkflowStep } from '../phases/types';

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

  function pushStep(step: string): WorkflowStep {
    const editorStore = useEditorStore.getState();
    const validated = validateWorkflowStep(processJsonChunk(step));
    const currentContent = editorStore.content || [];
    editorStore.setContent([...currentContent, validated]);

    return validated;
  }

  function pushStepToVfs(step: WorkflowStep, code: string): void {
    if (code === '') return;
    useVFSStore.getState().addServiceImplementation(step, code);
  }

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
    pushStep(interfaceResult);

    /* ===========================
     * ===== ENRICH STEP ========
     * =========================== */
    console.log('firstStepPhase (enrich)');
    const enrichStep = yield* retryableAsyncGenerator(
      () => firstStepPhase(userReq, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepEnrichResponse(enrichStep);
    const validatedEnrich = pushStep(enrichStep);

    const enrichCode = yield* retryableAsyncGenerator(
      () => generateEnrichFunction(validatedEnrich),
      retryOptions,
    );
    assistantMessage.addStepEnrichCode(enrichCode);
    pushStep(enrichCode);

    /* ===========================
     * ===== ANALYZE STEP ========
     * =========================== */
    console.log('secondStepPhase (analyze)');
    const analyzeStep = yield* retryableAsyncGenerator(
      () => secondStepPhase(userReq, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepAnalyzeResponse?.(analyzeStep);
    const validatedAnalyze = pushStep(analyzeStep);

    const analyzeCode = yield* retryableAsyncGenerator(
      () => generateAnalyzeFunction(validatedAnalyze, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepAnalyzeCode(analyzeCode);
    pushStepToVfs(validatedAnalyze, analyzeCode);

    /* ===========================
     * ===== DECIDE STEP ========
     * =========================== */
    console.log('thirdStepPhase (decide)');
    const decideStep = yield* retryableAsyncGenerator(
      () => thirdStepPhase(userReq, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepDecideResponse?.(decideStep);
    const validatedDecide = pushStep(decideStep);

    const decideCode = yield* retryableAsyncGenerator(
      () => generateDecideFunction(validatedDecide, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepDecideCode(decideCode);
    pushStepToVfs(validatedDecide, decideCode);

    /* ============================
     * ===== FORMAT STEP =========
     * ============================ */
    console.log('fourthStepPhase (format)');
    const formatStep = yield* retryableAsyncGenerator(
      () => fourthStepPhase(userReq, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepFormatResponse(formatStep);
    const validatedFormat = pushStep(formatStep);

    const formatCode = yield* retryableAsyncGenerator(
      () => generateFormatFunction(validatedFormat, assistantMessage),
      retryOptions,
    );
    assistantMessage.addStepFormatCode(formatCode);
    pushStepToVfs(validatedFormat, formatCode);

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
