// src/features/ollama-api/streaming/api/workflow-chain.ts
import { myJsonParser } from '@/features/editor/transpilers-json-source/my-json-parser';
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { useAssistantConfigStore } from '../../../chat/store/assistant-config-store';
import { useChatStore } from '../../../chat/store/chat-store';
import { createChat } from '../infra/create-chat';
import { retryWithDelay } from '../infra/retry-with-delay';
import { alignmentPhase } from '../phases/alignment-phase';
import { interfacePhase } from '../phases/interface-phase';
import { firstStepPhase } from '../phases/steps/step-1-phase';
import { secondStepPhase } from '../phases/steps/step-2-phase';
import { thirdStepPhase } from '../phases/steps/step-3-phase';
import { fourthStepPhase } from '../phases/steps/step-4-phase';
import { fifthStepPhase } from '../phases/steps/step-5-phase';
import { sixthStepPhase } from '../phases/steps/step-6-phase';
import { WorkflowPhase } from '../phases/types';

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
  const { selectedModel, parameters, ollamaUrl } = useAssistantConfigStore.getState();

  const chatStore = useChatStore.getState();
  const messages = chatStore.getAllMessages();

  if (messages.length > 1) {
    throw new WorkflowChainError('Only one message is supported', 'stream', undefined, {
      messageCount: messages.length,
    });
  }

  const chatFn = createChat(ollamaUrl, selectedModel, parameters);
  const userRequest =
    typeof messages[0].content === 'string'
      ? messages[0].content
      : JSON.stringify(messages[0].content);

  try {
    /* ===========================
     * ===== ALIGNMENT PHASE =====
     * ===========================*/
    const alignmentResult = yield* retryWithDelay(
      () => alignmentPhase(userRequest, chatFn),
      response => response,
      () => void 0,
      'alignment',
      userRequest,
    );

    chatStore.addAlignmentMessage(alignmentResult);
    // TODO: add other store side-effects
    yield '[BREAK]';

    /* ===========================
     * ===== INTERFACE PHASE =====
     * ===========================*/
    const parsedInterfaceResult = yield* retryWithDelay(
      () => interfacePhase(userRequest, alignmentResult, chatFn),
      response => myJsonParser(response),
      parsed => {
        // Validate each parsed workflow step
        parsed.forEach(step => {
          if (step.type === 'json') {
            // validateWorkflowStep(step.content);
          }
        });
      },
      'interface',
      userRequest,
      alignmentResult,
    );
    chatStore.addInterfaceMessage(parsedInterfaceResult);
    // const workflowPath = useWorkflowStore.getState().createWorkflow(parsedInterfaceResult);
    // useEditorStore.getState().setFilePath(workflowPath);
    // TODO: add other store side-effects
    yield '[BREAK]';

    /* ======================
     * ===== FIRST STEP =====
     * ======================*/
    const parsedFirstStepResult = yield* retryWithDelay(
      () =>
        firstStepPhase(
          userRequest,
          alignmentResult,
          parsedInterfaceResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          chatFn,
        ),
      response => {
        console.log('response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.forEach(step => {
          if (step.type === 'json') {
            // validateWorkflowStep(step.content);
          }
        });
      },
      'step',
      userRequest,
      alignmentResult,
      parsedInterfaceResult,
    );
    chatStore.addStepMessage(parsedFirstStepResult);
    yield '[BREAK]';

    /* =======================
     * ===== SECOND STEP =====
     * =======================*/
    const parsedSecondStepResult = yield* retryWithDelay(
      () =>
        secondStepPhase(
          userRequest,
          alignmentResult,
          parsedInterfaceResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedFirstStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          chatFn,
        ),
      response => {
        console.log('second step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.forEach(step => {
          if (step.type === 'json') {
            // validateWorkflowStep(step.content);
          }
        });
      },
      'step',
      userRequest,
      parsedFirstStepResult,
    );
    chatStore.addStepMessage(parsedSecondStepResult);
    yield '[BREAK]';

    /* =======================
     * ===== THIRD STEP ======
     * =======================*/
    const parsedThirdStepResult = yield* retryWithDelay(
      () =>
        thirdStepPhase(
          userRequest,
          alignmentResult,
          parsedInterfaceResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedFirstStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedSecondStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          chatFn,
        ),
      response => {
        console.log('third step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.forEach(step => {
          if (step.type === 'json') {
            // validateWorkflowStep(step.content);
          }
        });
      },
      'step',
      userRequest,
      parsedSecondStepResult,
    );
    chatStore.addStepMessage(parsedThirdStepResult);
    yield '[BREAK]';

    /* ========================
     * ===== FOURTH STEP ======
     * ========================*/
    const parsedFourthStepResult = yield* retryWithDelay(
      () =>
        fourthStepPhase(
          userRequest,
          alignmentResult,
          parsedInterfaceResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedFirstStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedSecondStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedThirdStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          chatFn,
        ),
      response => {
        console.log('fourth step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.forEach(step => {
          if (step.type === 'json') {
            // validateWorkflowStep(step.content);
          }
        });
      },
      'step',
      userRequest,
      parsedThirdStepResult,
    );
    chatStore.addStepMessage(parsedFourthStepResult);
    yield '[BREAK]';

    /* =======================
     * ===== FIFTH STEP ======
     * =======================*/
    const parsedFifthStepResult = yield* retryWithDelay(
      () =>
        fifthStepPhase(
          userRequest,
          alignmentResult,
          parsedInterfaceResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedFirstStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedSecondStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedThirdStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedFourthStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          chatFn,
        ),
      response => {
        console.log('fifth step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.forEach(step => {
          if (step.type === 'json') {
            // validateWorkflowStep(step.content);
          }
        });
      },
      'step',
      userRequest,
      parsedFourthStepResult,
    );
    chatStore.addStepMessage(parsedFifthStepResult);
    yield '[BREAK]';

    /* =======================
     * ===== SIXTH STEP ======
     * =======================*/
    const parsedSixthStepResult = yield* retryWithDelay(
      () =>
        sixthStepPhase(
          userRequest,
          alignmentResult,
          parsedInterfaceResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedFirstStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedSecondStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedThirdStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedFourthStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          parsedFifthStepResult.find(chunk => chunk.type === 'json')?.content as WorkflowStep,
          chatFn,
        ),
      response => {
        console.log('sixth step response', response);
        return myJsonParser(response);
      },
      parsed => {
        // Validate each parsed workflow step
        parsed.forEach(step => {
          if (step.type === 'json') {
            // validateWorkflowStep(step.content);
          }
        });
      },
      'step',
      userRequest,
      parsedFifthStepResult,
    );
    chatStore.addStepMessage(parsedSixthStepResult);
    yield '[BREAK]';

    return {
      workflow: [
        ...parsedInterfaceResult.filter(chunk => chunk.type === 'json').map(chunk => chunk.content),
        ...parsedFirstStepResult.filter(chunk => chunk.type === 'json').map(chunk => chunk.content),
        ...parsedSecondStepResult
          .filter(chunk => chunk.type === 'json')
          .map(chunk => chunk.content),
        ...parsedThirdStepResult.filter(chunk => chunk.type === 'json').map(chunk => chunk.content),
        ...parsedFourthStepResult
          .filter(chunk => chunk.type === 'json')
          .map(chunk => chunk.content),
        ...parsedFifthStepResult.filter(chunk => chunk.type === 'json').map(chunk => chunk.content),
        ...parsedSixthStepResult.filter(chunk => chunk.type === 'json').map(chunk => chunk.content),
      ],
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
