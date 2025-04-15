// src/features/ollama-api/streaming/api/workflow-chain.ts
import { myJsonParser } from '@/features/editor/transpilers-json-source/my-json-parser';
import { validateWorkflowStep } from '@/features/editor/transpilers-json-source/workflow-step-validator';
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { useAssistantConfigStore } from '../../../chat/store/assistant-config-store';
import { useChatStore } from '../../../chat/store/chat-store';
import { createChat } from '../infra/create-chat';
import { retryWithDelay } from '../infra/retry-with-delay';
import { alignmentPhase } from '../phases/alignment-phase';
import { interfacePhase } from '../phases/interface-phase';
import { firstStepPhase } from '../phases/steps/step-1-phase';
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

  try {
    /* ===========================
     * ===== ALIGNMENT PHASE =====
     * ===========================*/
    const alignmentResult = yield* retryWithDelay(
      () =>
        alignmentPhase(
          typeof messages[0].content === 'string'
            ? messages[0].content
            : JSON.stringify(messages[0].content),
          chatFn,
        ),
      response => response,
      () => void 0,
      'alignment',
      messages[0].content,
    );

    chatStore.addAlignmentMessage(alignmentResult);
    // TODO: add other store side-effects
    yield '[BREAK]';

    /* ===========================
     * ===== INTERFACE PHASE =====
     * ===========================*/
    const parsedInterfaceResult = yield* retryWithDelay(
      () =>
        interfacePhase(
          typeof messages[0].content === 'string'
            ? messages[0].content
            : JSON.stringify(messages[0].content),
          alignmentResult,
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
            validateWorkflowStep(step.content);
          }
        });
      },
      'interface',
      messages[0].content,
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
    const parsedStepsResult = yield* retryWithDelay(
      () =>
        firstStepPhase(
          typeof messages[0].content === 'string'
            ? messages[0].content
            : JSON.stringify(messages[0].content),
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
            validateWorkflowStep(step.content);
          }
        });
      },
      'step',
      messages[0].content,
      alignmentResult,
      parsedInterfaceResult,
    );
    chatStore.addStepMessage(parsedStepsResult);
    // useWorkflowStore.getState().addStepsToWorkflow(workflowPath, parsedStepsResult);
    // useVfsStore.getState().upsertServices(stepsResult.steps);

    return {
      workflow: parsedInterfaceResult
        .filter(chunk => chunk.type === 'json')
        .map(chunk => chunk.content),
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
