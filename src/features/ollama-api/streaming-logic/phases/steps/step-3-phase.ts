// src/features/ollama-api/streaming-logic/phases/steps/step-3-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { JSON_RULES } from '../rules';
import { UserRequest } from '../types';
import { STEP_1_PHASE_MESSAGES } from './step-1-phase';
import { STEP_2_PHASE_MESSAGES } from './step-2-phase';

export const STEP_3_PHASE_PROMPT = () =>
  `
Generate the third step: **Decide**.

This step:
- Uses output from the Analyze step
- Performs branching, filtering, or outcome selection based on analysis
- Determines the final path, classification, or selection for the workflow

Modules (pick one):
  decide: [select, filter, branch, classify, choose, match, group]
  slm  : [decide, pick, route]

${JSON_RULES}

Output a single, complete JSON object. Surrounded by \`\`\`json and \`\`\`.
`.trim();

export const STEP_3_PHASE_MESSAGES = (assistantMessage: AssistantMessage) => [
  {
    role: 'assistant',
    content: assistantMessage.getStepString(2),
  },
  { role: 'user', content: STEP_3_PHASE_PROMPT() },
];

export async function* thirdStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      ...STEP_1_PHASE_MESSAGES(userReq, assistantMessage),
      ...STEP_2_PHASE_MESSAGES(assistantMessage),
      ...STEP_3_PHASE_MESSAGES(assistantMessage),
    ],
  });
}
