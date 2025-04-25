// Import the core function to create a director (scene orchestrator)
import { createDirector } from '../../../_core';
// Import the workflow actors (roles and actions)
import { WorkflowActors as Actors } from '../conduits/workflow-conduit';

/**
 * UntilAlignedScene
 *
 * This scene implements an iterative refinement loop for a given workflow phase (e.g., 'inputs', 'enrichment').
 * It repeatedly prompts the user for feedback and allows the assistant to respond, until the user is satisfied and chooses to move to the next phase.
 *
 * @param currentPhase - The name of the current workflow phase (e.g., 'inputs')
 * @param nextPhase - The name of the next workflow phase (e.g., 'enrichment')
 * @returns a director (scene) handling the alignment/refinement loop
 */
export const UntilAlignedScene = (currentPhase: string, nextPhase: string) =>
  createDirector(
    'until-aligned', // Unique id for this scene
    `Until aligned in ${currentPhase}`, // Human-readable description
    { nextPhase }, // Pass next phase as context/parameter
  )(
    // === Finalize and store the assistant's accumulated response for this phase ===
    Actors.Accumulator.Finalize.Set('assistantAcc'),
    // === Start a new assistant thread from the accumulated response ===
    Actors.Thread.Assistant.From('assistantAcc'),
    // === Stop the stream to wait for user input ===
    Actors.Stream.Stop,
    // === Await user feedback and store it under a variable keyed by the current phase ===
    UserLand.AwaitFor.Response.Into('User Refinement Response: ' + currentPhase),
    // === Prompt the user with instructions for how to respond ===
    Actors.Prompt.Add.User`
      either respond with
      \`\`\`
      {
        "action": "Stay at ${() => currentPhase}"
        "response": [Ask more questions about ${() => currentPhase}]
      }
      \`\`\`
      OR
      \`\`\`
      {
        "action": "Move on to ${() => nextPhase}"
        "response": [How can the ${() => nextPhase} become more refined?]
      }
      \`\`\`

      The user Refinement response:
      ${c8 => c8.var.string('User Refinement Response: ' + currentPhase)}
    `,
    // === Finalize and start a new thread for the assistant's refinement response ===
    Actors.Prompt.Finalize.Set('thread'),
    Actors.Stream.Start,
    // === Store the assistant's refinement response for this phase ===
    Actors.Stream.Response.From('thread').Set('Assistant Refinement Response: ' + currentPhase),
    Actors.Accumulator.From('Assistant Refinement Response: ' + currentPhase),
    // === Continue the loop: start a new assistant thread from the latest response ===
    Actors.Thread.Assistant.From('Assistant Refinement Response: ' + currentPhase),
  );
