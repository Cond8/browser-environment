// src/features/ollama-api/streaming/phases/alignment-phase.ts
import { ChatRequest } from 'ollama';
import { WorkflowChainError } from '../api/workflow-chain';

export const ALIGNMENT_PROMPT = () =>
  `
You are an analyst who breaks down workflow requirements before implementation.

Analyze the request and provide a structured response using markdown formatting:

### Goal
- **Core Objective**: [Brief description of the main goal]
- **Key Constraints**: [List of important limitations or requirements]

### Components
- **Inputs**: [Required input data or parameters]
- **Outputs**: [Expected output or results]
- **Processing Steps**: [Key steps in the workflow]

### Technical Direction
- **Suggested Approach**: [Recommended workflow implementation strategy]
- **Considerations**: [Important technical factors to consider]

Be concise and use markdown formatting for better readability. Planning mode.

## Task: Analyze Request
`.trim();

export async function* alignmentPhase(
  userRequest: string,
  chatFn: (
    request: Omit<ChatRequest, 'model' | 'stream'>,
  ) => AsyncGenerator<string, string, unknown>,
): AsyncGenerator<string, string, unknown> {
  try {
    return yield* chatFn({
      messages: [
        {
          role: 'system',
          content: ALIGNMENT_PROMPT(),
        },
        {
          role: 'user',
          content: userRequest,
        },
      ],
    });
  } catch (err) {
    throw new WorkflowChainError(
      'Alignment phase failed',
      'alignment',
      err instanceof Error ? err : undefined,
      userRequest,
    );
  }
}
