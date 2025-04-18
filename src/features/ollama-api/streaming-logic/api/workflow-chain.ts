// src/features/ollama-api/streaming-logic/api/workflow-chain.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { UserMessage } from '@/features/chat/models/message';
import { useEditorStore } from '@/features/editor/stores/editor-store';
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { validateWorkflowStep } from '@/features/editor/transpilers-json-source/workflow-step-validator';
import { useChatStore } from '../../../chat/store/chat-store';
import { useVFSStore } from '../../../vfs/store/vfs-store';
import { chatFn } from '../infra/create-chat';
import {
  retryableAsyncGenerator,
  RetryableGeneratorOptions,
} from '../infra/retryable-async-generator';
import { ALIGNMENT_MESSAGES } from '../phases/alignment-phase';
import { INTERFACE_MESSAGES } from '../phases/interface-phase';
import { STEP_1_CODE_MESSAGES } from '../phases/js/step-1-code';
import { STEP_2_CODE_MESSAGES } from '../phases/js/step-2-code';
import { STEP_3_CODE_MESSAGES } from '../phases/js/step-3-code';
import { STEP_4_CODE_MESSAGES } from '../phases/js/step-4-code';
import { generateCodeFunction } from '../phases/js/wrapper';
import { STEP_1_PHASE_MESSAGES } from '../phases/steps/step-1-phase';
import { STEP_2_PHASE_MESSAGES } from '../phases/steps/step-2-phase';
import { STEP_3_PHASE_MESSAGES } from '../phases/steps/step-3-phase';
import { STEP_4_PHASE_MESSAGES } from '../phases/steps/step-4-phase';
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

  function pushStepToEditor(step: string): WorkflowStep {
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
    /**============================
     * ===== ALIGNMENT PHASE ======
     * ============================ */
    console.log('alignmentPhase');
    const alignmentResult = yield* retryableAsyncGenerator(
      () => chatFn({ messages: ALIGNMENT_MESSAGES(userReq) }),
      retryOptions,
    );
    console.log('alignmentResult', { alignmentResult });
    assistantMessage.addAlignmentResponse(alignmentResult);

    /**=============================
     * ===== INTERFACE PHASE =======
     * ============================= */
    console.log('interfacePhase');
    const interfaceResult = yield* retryableAsyncGenerator(
      () => chatFn({ messages: INTERFACE_MESSAGES(userReq, assistantMessage) }),
      retryOptions,
    );
    assistantMessage.addInterfaceResponse(interfaceResult);
    pushStepToEditor(interfaceResult);

    /**============================
     * ===== LOGIC STEPS LOOP =====
     * ============================ */

    const stepDefs = [
      {
        name: 'enrich',
        phaseMessages: () => STEP_1_PHASE_MESSAGES(userReq, assistantMessage),
        codeMessages: () => STEP_1_CODE_MESSAGES(assistantMessage.getStep(1)),
        addResponse: (dsl: string) => assistantMessage.addStepEnrichResponse(dsl),
        addCode: (code: string) => assistantMessage.addStepEnrichCode(code),
      },
      {
        name: 'analyze',
        phaseMessages: () => [
          ...STEP_1_PHASE_MESSAGES(userReq, assistantMessage),
          ...STEP_2_PHASE_MESSAGES(assistantMessage),
        ],
        codeMessages: () => [
          ...STEP_1_CODE_MESSAGES(assistantMessage.getStep(1)),
          ...STEP_2_CODE_MESSAGES(assistantMessage),
        ],
        addResponse: (dsl: string) => assistantMessage.addStepAnalyzeResponse(dsl),
        addCode: (code: string) => assistantMessage.addStepAnalyzeCode(code),
      },
      {
        name: 'decide',
        phaseMessages: () => [
          ...STEP_1_PHASE_MESSAGES(userReq, assistantMessage),
          ...STEP_2_PHASE_MESSAGES(assistantMessage),
          ...STEP_3_PHASE_MESSAGES(assistantMessage),
        ],
        codeMessages: () => [
          ...STEP_1_CODE_MESSAGES(assistantMessage.getStep(1)),
          ...STEP_2_CODE_MESSAGES(assistantMessage),
          ...STEP_3_CODE_MESSAGES(assistantMessage),
        ],
        addResponse: (dsl: string) => assistantMessage.addStepDecideResponse?.(dsl),
        addCode: (code: string) => assistantMessage.addStepDecideCode(code),
      },
      {
        name: 'format',
        phaseMessages: () => [
          ...STEP_1_PHASE_MESSAGES(userReq, assistantMessage),
          ...STEP_2_PHASE_MESSAGES(assistantMessage),
          ...STEP_3_PHASE_MESSAGES(assistantMessage),
          ...STEP_4_PHASE_MESSAGES(assistantMessage),
        ],
        codeMessages: () => [
          ...STEP_1_CODE_MESSAGES(assistantMessage.getStep(1)),
          ...STEP_2_CODE_MESSAGES(assistantMessage),
          ...STEP_3_CODE_MESSAGES(assistantMessage),
          ...STEP_4_CODE_MESSAGES(assistantMessage),
        ],
        addResponse: (dsl: string) => assistantMessage.addStepFormatResponse(dsl),
        addCode: (code: string) => assistantMessage.addStepFormatCode(code),
      },
    ];

    const validatedSteps: WorkflowStep[] = [];

    for (const def of stepDefs) {
      console.log(`stepPhase (${def.name})`);

      const dsl = yield* retryableAsyncGenerator(
        () => chatFn({ messages: def.phaseMessages() }),
        retryOptions,
      );
      def.addResponse(dsl);

      const validated = pushStepToEditor(dsl);
      validatedSteps.push(validated);

      const code = yield* retryableAsyncGenerator(
        () => generateCodeFunction(() => chatFn({ messages: def.codeMessages() }), validated),
        retryOptions,
      );
      def.addCode(code);

      pushStepToVfs(validated, code);
    }

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
