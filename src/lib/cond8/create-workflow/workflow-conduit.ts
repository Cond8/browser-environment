// src/lib/cond8/create-workflow/workflow-conduit.ts
import { CoreRedprint, StrictObjectKVService } from '../_core';
import { createPromptActors } from './actors/prompt';
import { PromptService } from './services/prompt-service';

export type WorkflowConduitInput = {
  startPrompt: string;
};

export class WorkflowConduit extends CoreRedprint<WorkflowConduitInput> {
  public locals = new StrictObjectKVService<PropertyKey, unknown>('locals');
  public prompt = new PromptService('prompt');
  constructor(input: WorkflowConduitInput) {
    super(input);
  }
}

export const WorkflowActors = {
  Prompt: createPromptActors<WorkflowConduit>(),
};
