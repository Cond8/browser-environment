// src/lib/cond8/create-workflow/start-create-workflow.ts
import { createDirector } from '../../_core';
import {
  WorkflowActors as Actors,
  WorkflowConduit,
  WorkflowConduitInput,
} from './conduits/workflow-conduit';

const StartCreateWorkflowDirector = createDirector<WorkflowConduit>(
  'start-create-workflow',
  'Create a new workflow',
).init<WorkflowConduitInput>(input => ({
  conduit: new WorkflowConduit(input),
}))(c8 => {
  const userStartingPrompt = c8.body.startPrompt;
  c8.var('User Starting Prompt', userStartingPrompt);
  return c8;
});

StartCreateWorkflowDirector(
  Actors.Prompt.Add.System`
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
  Actors.Prompt.Add.User`
    ${c8 => c8.var('User Starting Prompt')}
  `,
  Actors.Thread.User.From('User Starting Prompt'),
)(
  Actors.Prompt.Finalize.Set('thread'),
  Actors.Stream.Start,
  Actors.Stream.Response.From('thread').Set('Assistant Alignment Response'),

  Actors.Prompt.Assistant.from('Assistant Alignment Response'),
  Actors.Accumulator.From('Assistant Alignment Response'),
)(
  Actors.Prompt.Add.User`
    Assume that we're aligned for now. Suggest to me how we can refine the inputs. Then ask me how I want to proceed.
  `,

  Actors.Prompt.Finalize.Set('thread'),
  Actors.Stream.Response.From('thread').Set('Assistant Inputs Refinement Query'),
  Actors.Accumulator.From('Assistant Inputs Refinement Query'),
)(
  Actors.Support.Do(
    Actors.Accumulator.Finalize.Set('assistantAcc'),
    Actors.Thread.Assistant.From('assistantAcc'),
    Actors.Stream.Stop,
    Actors.UserLand.Response.Into('User Refinement Response'),
    Actors.Prompt.Add.User`
      either respond with
      \`\`\`
      {
        "action": "Stay at inputs"
        "response": [Ask more questions about inputs]
      }
      \`\`\`
      OR
      \`\`\`
      {
        "action": "Move on to enrichment"
        "response": [How can the enrichment become more refined?]
      }
      \`\`\`

      The user Refinement response:
      ${c8 => c8.var.string('User Refinement Response')}
    `,
    Actors.Prompt.Finalize.Set('thread'),
    Actors.Stream.Start,
    Actors.Stream.Response.From('thread').Set('Assistant Inputs Refinement Response'),
    Actors.Accumulator.From('Assistant Inputs Refinement Response'),
    Actors.Thread.Assistant.From('Assistant Inputs Refinement Response'),
  ).While(c8 => c8.var('Assistant Inputs Refinement Response') === 'Stay at inputs'),
  Actors.Stream.Stop,
)(
  Actors.Accumulator.Summurize().Into('Refined Inputs'),
  Actors.Accumulator.Reset(),
  Actors.Prompt.UndoUntil('Assistant Alignment Response'),
  Actors.Prompt.User`
    This is what I expect from the inputs.
    ${c8 => c8.var('Assistant Alignment Response')}

    Now suggest to me how we can enrich the inputs.
    You already mentioned: ${c8 => c8.var('Assistant Alignment: Enrichment')}
  `,
);

export default StartCreateWorkflowDirector.fin(c8 => c8);
