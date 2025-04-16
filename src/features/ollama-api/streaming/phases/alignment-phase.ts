// src/features/ollama-api/streaming/phases/alignment-phase.ts
import { chatFn } from '../infra/create-chat';
import { UserRequest } from './types';

export const ALIGNMENT_PROMPT = () =>
  `
You are a workflow analyst. Every task must be broken down into exactly six linear steps:

1. **Validate** Ensure inputs are structurally and semantically correct  
2. **Extract** Parse structured data and retrieve directly linked inputs  
3. **Enrich** Add external or contextual knowledge needed for understanding  
4. **Analyze** Perform computations, transformations, or scoring  
5. **Decide** Apply logical rules or thresholds to draw a conclusion  
6. **Format** Shape the final output into a returnable result

---

Analyze the following request and return a structured response using this format:

### Goal
- **Objective**: [What is the task trying to accomplish?]
- **Constraints**: [Important limitations, rules, or requirements]

### Inputs
- [List required input fields]

### Outputs
- [List expected results or outputs]

### Plan
Use exactly one step per line, labeled 1-6:

1. **Validate** [...]
2. **Extract** [...]
3. **Enrich** [...]
4. **Analyze** [...]
5. **Decide** [...]
6. **Format** [...]

---

Be precise. Use markdown formatting. Think before writing.

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
