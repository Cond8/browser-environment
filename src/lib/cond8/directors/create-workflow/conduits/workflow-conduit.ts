// src/lib/cond8/create-workflow/workflow-conduit.ts
import { CoreRedprint, StrictObjectKVService } from '../../../_core';
import { createChatActors } from '../actors/chat';
import { createThreadActors } from '../actors/thread';
import { ThreadService } from '../services/thread-service';

export type WorkflowConduitInput = {
  startPrompt: string;
};

export class WorkflowConduit extends CoreRedprint<WorkflowConduitInput> {
  public locals = new StrictObjectKVService<PropertyKey, unknown>('locals');
  public thread = new ThreadService('thread');
  constructor(input: WorkflowConduitInput) {
    super(input);
  }
}

export const WorkflowActors = {
  Prompt: createThreadActors<WorkflowConduit>(),
  Chat: createChatActors<WorkflowConduit>(),
};
