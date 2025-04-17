// src/features/ollama-api/streaming-logic/phases/alignment-phase.ts
import { chatFn } from '../infra/create-chat';
import { UserRequest } from './types';

export const ALIGNMENT_PROMPT = () =>
  `
You are a workflow analyst. Every task must be broken down into exactly three linear steps:

1. **Enrich** — Fetch required external data or side effects  
2. **Logic** — Analyze the inputs and make decisions  
3. **Format** — Shape the final output into a returnable result

---

Analyze the following request and return a structured response in this format:

### Goal
- **Objective**: [What is the task trying to accomplish?]
- **Constraints**: [Key rules or expectations for behavior]

### Inputs
- [List each required input field]

### Outputs
- [List each expected output field]

### Plan
Use exactly three steps, labeled 1–3:

1. **Enrich** [...]
2. **Logic** [...]
3. **Format** [...]

---

Be precise. Use markdown formatting. No bullet points inside the plan. Keep each step to one sentence.

## Task: Analyze Request
`.trim();

export async function* alignmentPhase(
  userReq: UserRequest,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      {
        role: 'system',
        content: ALIGNMENT_PROMPT(),
      },
      {
        role: 'user',
        content: userReq.userRequest,
      },
    ],
  });
}
