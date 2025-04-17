// src/features/ollama-api/streaming-logic/phases/steps/step-1-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { JSON_RULES } from '../rules';
import { UserRequest } from '../types';

export const SYSTEM_PROMPT = (userRequest: string, interfaceResponse: string) =>
  `
You are generating the first step of a workflow: the **Enrich** step.

This step is responsible for gathering or synthesizing new information that is not yet present. It may call external APIs, perform lookups, or load data from persistent sources. Think of this step as expanding the input with valuable context or facts needed for subsequent reasoning.

The output of this step should feel like a *natural enrichment* of the input — it provides missing data, augments what the user gave, or prepares the ground for thoughtful logic.

You must return a **single valid JSON object** describing this step in the following structure:

{
  "name": "PascalCaseName",
  "module": "ChosenModule",
  "functionName": "camelCaseTwoWords",
  "goal": "A markdown‑formatted summary of what this step does.",
  "params": {
    "inputName": {
      "type": "string",
      "description": "Explanation of this input."
    }
  },
  "returns": {
    "outputName": {
      "type": "string",
      "description": "Explanation of this output."
    }
  }
}

Modules (pick one):
  data-enrichment: [extract, parse, fetch, lookup, retrieve, read]
  slm-enrichment : [synthesize, enrich, expand, integrate]

${JSON_RULES}
- name must be in PascalCase
- functionName must be two words in camelCase
- All keys must be single camelCase words
- Valid types: string, number, boolean, object, array
- Do **not** use: required, properties, items, enum, default, or nested object schemas
- Do **not** include arrays of objects or extra fields

User Request:
${userRequest}

Interface:
${interfaceResponse}

Respond with a single valid JSON object only.
`.trim();

export const STEP_1_MESSAGES = (userReq: UserRequest, assistantMessage: AssistantMessage) => [
  {
    role: 'system',
    content: SYSTEM_PROMPT(userReq.userRequest, assistantMessage.interfaceString),
  },
  {
    role: 'user',
    content: assistantMessage.alignmentResponse,
  },
];

export async function* firstStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({ messages: STEP_1_MESSAGES(userReq, assistantMessage) });
}
