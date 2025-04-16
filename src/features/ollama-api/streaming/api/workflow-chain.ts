// src/features/ollama-api/streaming/api/workflow-chain.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { useChatStore } from '../../../chat/store/chat-store';
import { alignmentPhase } from '../phases/alignment-phase';
import { interfacePhase } from '../phases/interface-phase';
import { firstStepPhase } from '../phases/steps/step-1-phase';
import { secondToSixthStepPhase } from '../phases/steps/step-2-to-6-phase';
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

  const userRequest = messages[0].content;
  const userReq: UserRequest = {
    userRequest: typeof userRequest === 'string' ? userRequest : JSON.stringify(userRequest),
    alignmentResponse: '',
  };

  // Create a single assistant message at the start
  const assistantMessage = new AssistantMessage();

  try {
    /* ===========================
     * ===== ALIGNMENT PHASE =====
     * ===========================*/
    console.log('alignmentPhase');
    const alignmentResult = yield* alignmentPhase(userReq);
    assistantMessage.addAlignmentResponse(alignmentResult);
    userReq.alignmentResponse = alignmentResult;

    yield '\n\n';

    /* ===========================
     * ===== INTERFACE PHASE =====
     * ===========================*/
    try {
      console.log('interfacePhase');
      const interfaceResult = yield* interfacePhase(userReq);
      assistantMessage.addInterfaceResponse(interfaceResult);
    } catch (error) {
      console.error('Error in interfacePhase:', error);
      throw new WorkflowChainError('Error in interfacePhase', 'interface', error as Error);
    }

    yield '\n\n';

    /* =============================
     * ===== FIRST STEP PHASES =====
     * =============================*/
    console.log('firstStepPhase');
    const firstStepResult = yield* firstStepPhase(userReq, assistantMessage);
    assistantMessage.addStepResponse(firstStepResult);

    yield '\n\n';

    /* ================================
     * ===== SECOND TO SIXTH STEP =====
     * ================================*/
    for (let i = 2; i < 7; i++) {
      console.log(`secondToSixthStepPhase ${i}`);
      const parsedSecondToSixthStepResult = yield* secondToSixthStepPhase(
        userReq,
        assistantMessage,
        i,
      );
      assistantMessage.addStepResponse(parsedSecondToSixthStepResult);

      yield '\n\n';
    }

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
