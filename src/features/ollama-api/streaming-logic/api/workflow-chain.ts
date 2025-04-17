// src/features/ollama-api/streaming-logic/api/workflow-chain.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { UserMessage } from '@/features/chat/models/message';
import { useChatStore } from '../../../chat/store/chat-store';
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

  const assistantMessage = new AssistantMessage();

  try {
    /* ============================
     * ===== ALIGNMENT PHASE =====
     * ============================ */
    console.log('alignmentPhase');
    const alignmentResult = yield* alignmentPhase(userReq);
    assistantMessage.addAlignmentResponse(alignmentResult);
    userReq.alignmentResponse = alignmentResult;

    yield '\n\n';

    /* =============================
     * ===== INTERFACE PHASE ======
     * ============================= */
    try {
      console.log('interfacePhase');
      const interfaceResult = yield* interfacePhase(userReq);
      assistantMessage.addInterfaceResponse(interfaceResult);
    } catch (error) {
      console.error('Error in interfacePhase:', error);
      throw new WorkflowChainError('Error in interfacePhase', 'interface', error as Error);
    }

    yield '\n\n';

    /* ===========================
     * ===== ENRICH STEP ========
     * =========================== */
    console.log('firstStepPhase (enrich)');
    const enrichStep = yield* firstStepPhase(userReq, assistantMessage);
    assistantMessage.addStepResponse(enrichStep);

    yield '\n\n';

    /* ==========================
     * ===== LOGIC STEP ========
     * ========================== */
    console.log('secondStepPhase (logic)');
    const logicStep = yield* secondStepPhase(userReq, assistantMessage);
    assistantMessage.addStepResponse(logicStep);

    yield '\n\n';

    /* ============================
     * ===== FORMAT STEP =========
     * ============================ */
    console.log('thirdStepPhase (format)');
    const formatStep = yield* thirdStepPhase(userReq, assistantMessage);
    assistantMessage.addStepResponse(formatStep);

    return assistantMessage;
  } catch (error) {
    const err =
      error instanceof WorkflowChainError
        ? error
        : new WorkflowChainError('Unexpected error in workflow chain', 'stream', error as Error);

    assistantMessage.setError(err);
    throw err;
  }
}
