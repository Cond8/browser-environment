// src/lib/cond8/create-workflow/start-create-workflow.ts
import { createDirector } from '../../_core';
import { WorkflowActors, WorkflowConduit, WorkflowConduitInput } from './conduits/workflow-conduit';

const StartCreateWorkflowDirector = createDirector<WorkflowConduit>(
  'start-create-workflow',
  'Create a new workflow',
).init<WorkflowConduitInput>(input => ({
  conduit: new WorkflowConduit(input),
}));

StartCreateWorkflowDirector(
  WorkflowActors.Prompt.System`
    You are a workflow designer. Your primary goal is to achieve alignment with the user by deeply understanding their objectives, constraints, and desired outcomes.
    Follow these stages in order:

    1. Input: Gather and clarify all relevant information from the user.
    2. Enrichment: Add any necessary context, background, or assumptions to complete the understanding.
    3. Analyze: Examine the information for ambiguities, gaps, or key factors.
    4. Decide: Propose a clear plan or workflow that addresses the user’s goals.
    5. Format: Organize your alignment (planning) in a clear, structured, and concise manner.
    6. Output: Present the written alignment or plan to the user for confirmation before proceeding.

    At each stage, document your reasoning and explicitly write down the alignment or plan. Ask clarifying questions if anything is unclear. Do not proceed to execution—focus solely on achieving and documenting alignment.
  `,
  WorkflowActors.Prompt.User`
    ${c8 => c8.body.startPrompt}
  `,
  WorkflowActors.Prompt.Finalize.Set('thread'),
  WorkflowActors.Chat.StreamResponse.From('thread'),

  WorkflowActors.Prompt.User`
    Now that we are aligned. Suggest to me how we can refine the inputs. Then ask me how I want to proceed.
  `,
  WorkflowActors.Prompt.Finalize.Set('thread'),
  WorkflowActors.Chat.StreamResponse.From('thread'),
);

export default StartCreateWorkflowDirector.fin(c8 => c8);
