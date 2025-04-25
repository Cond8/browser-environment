// src/lib/cond8/create-workflow/workflow-conduit.ts
import { CoreRedprint, StrictObjectKVService } from '../../../_core';
import { createAccumulatorActors } from '../actors/accumulator';
import { createPromptActors } from '../actors/prompt';
import { createStreamActors } from '../actors/stream';
import { createThreadActors } from '../actors/thread';
import { AssistantAccService } from '../services/assistant-acc-service';
import { PromptService } from '../services/prompt-service';
import { StreamService } from '../services/stream-service';
import { ThreadService } from '../services/thread-service';

export type WorkflowConduitInput = {
  startPrompt: string;
};

export class WorkflowConduit extends CoreRedprint<WorkflowConduitInput> {
  public locals = new StrictObjectKVService<PropertyKey, unknown>('locals');
  public thread = new ThreadService();
  public prompt = new PromptService();
  public stream = new StreamService();
  public assistAcc = new AssistantAccService();
  constructor(input: WorkflowConduitInput) {
    super(input);
  }
}

export const WorkflowActors = {
  Thread: createThreadActors<WorkflowConduit>(),
  Prompt: createPromptActors<WorkflowConduit>(),
  Stream: createStreamActors<WorkflowConduit>(),
  Accumulator: createAccumulatorActors<WorkflowConduit>(),
};
