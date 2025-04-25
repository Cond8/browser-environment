// src/lib/cond8/create-workflow/start-create-workflow.ts
// Import the core function to create a director (scene/step orchestrator)
import { createDirector } from '../../_core';
// Import workflow-specific actors, conduit (state carrier), and input types
import {
  WorkflowActors as Actors,
  WorkflowConduit,
  WorkflowConduitInput,
} from './conduits/workflow-conduit';

// Import the reusable scene for iterative alignment (refinement loop)
import { UntilAlignedScene } from './scenes/until-aligned.js';

// Define the main director for starting the workflow creation process
// This director manages the alignment process from user prompt to enriched, analyzed, and decided plan
const StartCreateWorkflowDirector = createDirector<WorkflowConduit>(
  'start-create-workflow', // Unique id for this director
  'Create a new workflow', // Human-readable description
)
  // Initialize the workflow with the user's initial input
  .init<WorkflowConduitInput>(input => ({
    conduit: new WorkflowConduit(input), // Store input in the conduit (stateful object)
  }))(
  // First step: extract and store the user's starting prompt
  c8 => {
    const userStartingPrompt = c8.body.startPrompt;
    c8.var('User Starting Prompt', userStartingPrompt); // Save for later reference
    return c8;
  },
);

StartCreateWorkflowDirector(
  // === SYSTEM PROMPT: Set the workflow designer's role and the alignment process ===
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
  // === USER PROMPT: Present the user's initial prompt into the workflow ===
  Actors.Prompt.Add.User`
    ${c8 => c8.var('User Starting Prompt')}
  `,
  // === Start a new thread with the user's prompt as the origin ===
  Actors.Thread.User.From('User Starting Prompt'),
)(
  // === Finalize and start the thread, collect the assistant's initial alignment response ===
  Actors.Prompt.Finalize.Set('thread'),
  Actors.Stream.Start,
  Actors.Stream.Response.From('thread').Set('Assistant Alignment Response'),

  // === Store the assistant's alignment response for further refinement ===
  Actors.Prompt.Assistant.from('Assistant Alignment Response'),
  Actors.Accumulator.From('Assistant Alignment Response'),
)(
  // === Prompt the user to refine the inputs, simulating an alignment loop ===
  Actors.Prompt.Add.User`
    Assume that we're aligned for now. Suggest to me how we can refine the inputs. Then ask me how I want to proceed.
  `,

  Actors.Prompt.Finalize.Set('thread'),
  Actors.Stream.Response.From('thread').Set('Assistant Inputs Refinement Query'),
  Actors.Accumulator.From('Assistant Inputs Refinement Query'),
)(
  // === Enter the refinement loop for inputs using the UntilAlignedScene ===
  Actors.Conversation.RefineInput('User Starting Prompt')
    .UntilAligned(UntilAlignedScene('inputs', 'enrichment').AsActor)
    .Into('Refined Inputs'),
  Actors.Stream.Stop,
)(
  // === When aligned, summarize and reset accumulators, then transition to enrichment phase ===
  Actors.Accumulator.Summurize().Into('Refined Inputs'),
  Actors.Accumulator.Reset(),
  Actors.Prompt.UndoUntil('Assistant Alignment Response'),
  // === Confirm the expected inputs and prompt for enrichment suggestions ===
  Actors.Prompt.User`
    This is what I expect from the inputs.
    ${c8 => c8.var('Assistant Alignment Response')}

    Now suggest to me how we can enrich the inputs.
    You already mentioned: ${c8 => c8.var.string('Assistant Alignment: Enrichment')}
  `,
);

// Export the fully constructed director as the default
export default StartCreateWorkflowDirector.fin(c8 => c8);
