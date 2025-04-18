// src/features/ollama-api/streaming-logic/phases/alignment-phase.ts
import { chatFn } from '../infra/create-chat';
import { UserRequest } from './types';

export const ALIGNMENT_PROMPT = () =>
  `
You are a workflow analyst. Every task must be broken down into exactly four linear steps:

1. **Enrich** — Fetch required external data or trigger side effects (API calls, DB reads, etc.)
2. **Analyze** — Interpret, transform, or extract insights from the data (pure, side-effect-free calculations)
3. **Decide** — Determine an outcome, select a branch, or control the flow (branching, filtering, outcome selection)
4. **Format** — Shape the final output into a returnable result (final formatting, structuring, or rendering)

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
Use exactly four steps, labeled 1–4:

1. **Enrich** [...]
2. **Analyze** [...]
3. **Decide** [...]
4. **Format** [...]

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
