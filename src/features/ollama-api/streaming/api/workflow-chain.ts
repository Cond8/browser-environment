// src/features/ollama-api/streaming/api/workflow-chain.ts
import { AssistantMessage } from '@/features/chat/models/thread-message';
import {
  SLMOutput,
  WorkflowMultiStep,
} from '@/features/editor/transpilers-json-source/extract-text-parse';
import { myJsonParser } from '@/features/editor/transpilers-json-source/my-json-parser';
import { validateWorkflowStep } from '@/features/editor/transpilers-json-source/workflow-step-validator';
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { useChatStore } from '../../../chat/store/chat-store';
import { retryWithDelay } from '../infra/retry-with-delay';
import { alignmentPhase } from '../phases/alignment-phase';
import { interfacePhase } from '../phases/interface-phase';
import { firstStepPhase } from '../phases/steps/step-1-phase';
import { secondStepPhase } from '../phases/steps/step-2-phase';
import { thirdStepPhase } from '../phases/steps/step-3-phase';
import { fourthStepPhase } from '../phases/steps/step-4-phase';
import { fifthStepPhase } from '../phases/steps/step-5-phase';
import { sixthStepPhase } from '../phases/steps/step-6-phase';
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

  const userRequest = await messages[0].getContent();
  const userReq: UserRequest = {
    userRequest: typeof userRequest === 'string' ? userRequest : JSON.stringify(userRequest),
    alignmentResponse: '',
  };

  // Create a single assistant message at the start
  const assistantMessage = AssistantMessage.create(chatStore);

  try {
    /* ===========================
     * ===== ALIGNMENT PHASE =====
     * ===========================*/
    const alignmentResult = yield* retryWithDelay(
      () => alignmentPhase(userReq),
      response => {
        console.log('alignment response', response);
        return response;
      },
      () => void 0,
      'alignment',
      userRequest,
    );

    userReq.alignmentResponse = alignmentResult;
    assistantMessage.appendContent(alignmentResult, 'alignment');
    yield '[BREAK]';

    /* ===========================
     * ===== INTERFACE PHASE =====
     * ===========================*/
    const parsedInterfaceResult = yield* retryWithDelay(
      () => interfacePhase(userReq),
      response => {
        console.log('interface response', response);
        return myJsonParser(response);
      },
      parsed => {
        if (parsed instanceof SLMOutput) {
          assistantMessage.appendContent(parsed.toReponseString, 'interface');
          assistantMessage.setParsedContent(parsed);
        }
        return parsed;
      },
      'interface',
      userRequest,
    );

    const steps: WorkflowMultiStep = [parsedInterfaceResult];

    /* ===========================
     * ===== STEP PHASES =====
     * ===========================*/
    const stepResults = yield* retryWithDelay(
      () => firstStepPhase(userReq, steps),
      response => {
        console.log('step response', response);
        return myJsonParser(response);
      },
      parsed => {
        if (parsed instanceof SLMOutput) {
          assistantMessage.appendContent(parsed.toReponseString, 'step');
          assistantMessage.setParsedContent(parsed);
        }
        return parsed;
      },
      'step',
      userRequest,
    );

    steps.push(stepResults);

    /* =======================
     * ===== SECOND STEP =====
     * =======================*/
    const parsedSecondStepResult = yield* retryWithDelay(
      () => secondStepPhase(userReq, steps),
      response => {
        console.log('second step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.Chunks.forEach(chunk => {
          if (chunk.type === 'json') {
            validateWorkflowStep(chunk.content);
          }
        });
      },
      'step',
      userRequest,
      stepResults,
    );
    steps.push(parsedSecondStepResult);

    /* =======================
     * ===== THIRD STEP ======
     * =======================*/
    const parsedThirdStepResult = yield* retryWithDelay(
      () => thirdStepPhase(userReq, steps),
      response => {
        console.log('third step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.Chunks.forEach(chunk => {
          if (chunk.type === 'json') {
            validateWorkflowStep(chunk.content);
          }
        });
      },
      'step',
      userRequest,
      parsedSecondStepResult,
    );
    steps.push(parsedThirdStepResult);

    /* ========================
     * ===== FOURTH STEP ======
     * ========================*/
    const parsedFourthStepResult = yield* retryWithDelay(
      () => fourthStepPhase(userReq, steps),
      response => {
        console.log('fourth step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.Chunks.forEach(chunk => {
          if (chunk.type === 'json') {
            validateWorkflowStep(chunk.content);
          }
        });
      },
      'step',
      userRequest,
      parsedThirdStepResult,
    );
    steps.push(parsedFourthStepResult);

    /* =======================
     * ===== FIFTH STEP ======
     * =======================*/
    const parsedFifthStepResult = yield* retryWithDelay(
      () => fifthStepPhase(userReq, steps),
      response => {
        console.log('fifth step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.Chunks.forEach(chunk => {
          if (chunk.type === 'json') {
            validateWorkflowStep(chunk.content);
          }
        });
      },
      'step',
      userRequest,
      parsedFourthStepResult,
    );
    steps.push(parsedFifthStepResult);

    /* =======================
     * ===== SIXTH STEP ======
     * =======================*/
    const parsedSixthStepResult = yield* retryWithDelay(
      () => sixthStepPhase(userReq, steps),
      response => {
        console.log('sixth step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.Chunks.forEach(chunk => {
          if (chunk.type === 'json') {
            validateWorkflowStep(chunk.content);
          }
        });
      },
      'step',
      userRequest,
      parsedFifthStepResult,
    );
    steps.push(parsedSixthStepResult);

    return {
      workflow: steps
        .map(step => step.toWorkflowStep)
        .filter((step): step is WorkflowStep => step !== undefined),
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
