import { SYSTEM_PROMPT } from '../prompts/prompts-system';
import { StreamResponseFn, StreamYield } from '../stream-response';
import { WorkflowChainError } from '../workflow-chain';

export const ALIGNMENT_PROMPT = () =>
  `
You are an assistant that helps users define their workflow goals and requirements.

Your task is to acknowledge and restate the user's goal and problem description to ensure proper understanding before proceeding with workflow generation.

### Required Format:
- Acknowledge the user's goal
- Restate the problem description
- Indicate readiness to proceed with workflow generation

### Example Response:
"I understand you want to [restate goal]. The problem involves [restate problem description]. I'll help you create a workflow to address this."

## Task: Acknowledge and Align
Based on the user's request, provide a clear acknowledgment of their goal and problem description.

RULES:
- Be concise but thorough
- Show understanding of the user's needs
- Maintain a professional and helpful tone
- Do not start generating the workflow yet
`.trim();

export async function* handleAlignmentPhase(
  content: string,
  id: number,
  streamFn: StreamResponseFn,
): AsyncGenerator<StreamYield, void, unknown> {
  let response;
  try {
    response = yield* streamFn(id, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(ALIGNMENT_PROMPT()) },
        { role: 'user', content },
      ],
      stream: true,
    });
  } catch (err) {
    throw new WorkflowChainError(
      'Alignment phase failed',
      'alignment',
      err instanceof Error ? err : undefined,
      { content },
    );
  }

  yield { type: 'text', content: response, id };
}
