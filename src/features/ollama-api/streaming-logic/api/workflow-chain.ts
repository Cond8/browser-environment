// src/features/ollama-api/streaming-logic/api/workflow-chain.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { UserMessage } from '@/features/chat/models/message';
import { useChatStore } from '../../../chat/store/chat-store';
import { retryableAsyncGenerator } from '../infra/retryable-async-generator';
import { alignmentPhase } from '../phases/alignment-phase';
import { interfacePhase } from '../phases/interface-phase';
import { firstStepPhase } from '../phases/steps/step-1-phase';
import { secondStepPhase } from '../phases/steps/step-2-phase';
import { thirdStepPhase } from '../phases/steps/step-3-phase';
import { UserRequest, WorkflowPhase } from '../phases/types';

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
    alignmentResponse: '',
  };

  let rawSlmBuffer = '';

  try {
    /* ============================
     * ===== ALIGNMENT PHASE =====
     * ============================ */
    console.log('alignmentPhase');
    const alignmentResult = yield* retryableAsyncGenerator<string>('alignment', () =>
      alignmentPhase(userReq),
    );
    rawSlmBuffer += alignmentResult + '\n\n';
    userReq.alignmentResponse = alignmentResult;

    /* =============================
     * ===== INTERFACE PHASE ======
     * ============================= */
    try {
      console.log('interfacePhase');
      const interfaceResult = yield* retryableAsyncGenerator<string>('interface', () =>
        interfacePhase(userReq),
      );
      rawSlmBuffer += interfaceResult + '\n\n';
    } catch (error) {
      console.error('Error in interfacePhase:', error);
      throw new WorkflowChainError('Error in interfacePhase', 'interface', error as Error);
    }

    /* ===========================
     * ===== ENRICH STEP ========
     * =========================== */
    console.log('firstStepPhase (enrich)');
    const enrichStep = yield* retryableAsyncGenerator<string>('step', () =>
      firstStepPhase(userReq),
    );
    rawSlmBuffer += enrichStep + '\n\n';

    /* ==========================
     * ===== LOGIC STEP ========
     * ========================== */
    console.log('secondStepPhase (logic)');
    const logicStep = yield* retryableAsyncGenerator<string>('step', () =>
      secondStepPhase(userReq),
    );
    rawSlmBuffer += logicStep + '\n\n';

    /* ============================
     * ===== FORMAT STEP =========
     * ============================ */
    console.log('thirdStepPhase (format)');
    const formatStep = yield* retryableAsyncGenerator<string>('step', () =>
      thirdStepPhase(userReq),
    );
    rawSlmBuffer += formatStep;

    // Create final message from accumulated buffer
    const finalMessage = new AssistantMessage();
    finalMessage.rawChunks = [rawSlmBuffer];
    return finalMessage;
  } catch (error) {
    const err =
      error instanceof WorkflowChainError
        ? error
        : new WorkflowChainError('Unexpected error in workflow chain', 'stream', error as Error);

    // Create error message with accumulated buffer
    const errorMessage = new AssistantMessage();
    errorMessage.rawChunks = [rawSlmBuffer];
    errorMessage.setError(err);
    throw err;
  }
}
