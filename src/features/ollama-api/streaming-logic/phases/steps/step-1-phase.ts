// src/features/ollama-api/streaming/phases/steps/step-1-phase.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { chatFn } from '../../infra/create-chat';
import { UserRequest } from '../types';

export const SYSTEM_PROMPT = (userRequest: string, interfaceResponse: string) =>
  `
You are generating the first step of a 3-step workflow.

Each workflow has exactly 3 steps:
1. Enrich — Fetch external data or trigger side effects
2. Logic — Analyze and make decisions based on enriched input
3. Format — Shape the final output

This is Step 1: **Enrich**

Your task is to generate a single JSON object describing this step.

Structure:

{
  "name": "PascalCaseName",
  "module": "one of [extract, parse, validate, transform, logic, calculate, format, io, storage, integrate, understand, generate]",
  "functionName": "camelCaseTwoWords",
  "goal": "A markdown-formatted summary of what this step does.",
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

Rules:
- Output must be a single valid JSON object only.
- Do not include markdown, explanations, or formatting.
- name must be in PascalCase.
- functionName must be two words in camelCase.
- All field names must be in camelCase and single words.
- Valid types: string, number, boolean, object, array.
- Do not use: required, properties, items, enum, default, or any nesting.
- Do not include arrays of objects or additional fields.

This step should perform side effects: external fetches, lookups, file loads, or API calls.

User Request:
${userRequest}

Interface:
${interfaceResponse}

Output a single valid JSON object.
`.trim();

export const STEP_1_MESSAGES = (userReq: UserRequest, assistantMessage: AssistantMessage) => [
  {
    role: 'system',
    content: SYSTEM_PROMPT(userReq.userRequest, assistantMessage.interfaceString),
  },
  {
    role: 'user',
    content: userReq.alignmentResponse,
  },
];

export async function* firstStepPhase(
  userReq: UserRequest,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({ messages: STEP_1_MESSAGES(userReq, assistantMessage) });
}
