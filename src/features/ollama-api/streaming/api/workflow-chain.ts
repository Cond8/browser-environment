// src/features/ollama-api/streaming/api/workflow-chain.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { useChatStore } from '../../../chat/store/chat-store';
import { retryWithDelay } from '../infra/retry-with-delay';
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

export async function* executeWorkflowChain(): AsyncGenerator<
  string,
  {
    workflow?: WorkflowStep[];
    error?: WorkflowChainError;
  }
> {
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
    const alignmentResult = yield* retryWithDelay(
      async function* () {
        const alignmentResult = yield* alignmentPhase(userReq);
        assistantMessage.addAlignmentResponse(alignmentResult);
        return alignmentResult;
      },
      'alignment',
      userRequest,
    );

    userReq.alignmentResponse = alignmentResult;
    /* ===========================
     * ===== INTERFACE PHASE =====
     * ===========================*/
    yield* retryWithDelay(
      async function* () {
        const interfaceResult = yield* interfacePhase(userReq);
        assistantMessage.addInterfaceResponse(interfaceResult);
        return interfaceResult;
      },
      'interface',
      userRequest,
      assistantMessage,
    );

    /* =============================
     * ===== FIRST STEP PHASES =====
     * =============================*/
    yield* retryWithDelay(
      async function* () {
        const interfaceResult = yield* firstStepPhase(userReq, assistantMessage);
        assistantMessage.addStepResponse(interfaceResult);
        return interfaceResult;
      },
      'step',
      userRequest,
      assistantMessage,
    );

    /* ================================
     * ===== SECOND TO SIXTH STEP =====
     * ================================*/
    for (let i = 2; i < 6; i++) {
      yield* retryWithDelay(
        async function* () {
          const parsedSecondToSixthStepResult = yield* secondToSixthStepPhase(userReq, assistantMessage);
          assistantMessage.addStepResponse(parsedSecondToSixthStepResult);
          return parsedSecondToSixthStepResult;
        },
        'step',
        userRequest,
        assistantMessage,
      );
    }

    return {
      workflow: assistantMessage.workflow,
    };
  } catch (error) {
    const err =
      error instanceof WorkflowChainError
        ? error
        : new WorkflowChainError('Unexpected error in workflow chain', 'stream', error as Error);

    assistantMessage.setError(err);
    return { error: err };
  }
}
