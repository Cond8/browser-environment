// src/features/ollama-api/streaming-logic/phases/js/step-2-code.ts
import { Message } from 'ollama';
import { AssistantMessage } from '../../../../chat/models/assistant-message';
import { WorkflowStep } from '../types';

const examples: string[] = [
  'function calculateAverage(numbers) {\n  return numbers.reduce((a, b) => a + b, 0) / numbers.length;\n}',
  'function sumObjectValues(obj) {\n  return Object.values(obj).reduce((a, b) => a + b, 0);\n}',
  'function extractUniqueWords(text) {\n  return Array.from(new Set(text.split(/\\W+/).filter(Boolean)));\n}',
];

const USER_PROMPT = (step: WorkflowStep): string => {
  const { functionName, goal, params, returns } = step;

  const paramDefs = Object.entries(params)
    .map(([name, p]) => `- ${name}: ${p.type} — ${p.description}`)
    .join('\n');

  const returnDefs = Object.entries(returns)
    .map(([name, r]) => `- ${name}: ${r.type} — ${r.description}`)
    .join('\n');

  // Optional: Add examples if provided
  const examplesSection = `\nExamples:\n${examples
    .map((ex: string, i: number) => `Example ${i + 1}:\n${ex}`)
    .join('\n')}\n`;

  return `
You are implementing the **Analyze** step of a workflow.

This step must use enriched input from the previous step and perform pure, side-effect-free calculations, data transformations, or insight extraction. Do not include branching, filtering, or control flow—just analysis.

Function goal:
${goal}

Function signature:
Name: ${functionName}

Parameters:
${paramDefs}

Returns:
${returnDefs}
${examplesSection}
Instructions:
- Write a JavaScript function named "${functionName}" that performs analysis only.
- Do not include enrichment, branching, or formatting logic.
- Output only the function code, nothing else.

function
`;
};

export const STEP_2_CODE_MESSAGES = (assistantMessage: AssistantMessage): Message[] => [
  {
    role: 'system',
    content: assistantMessage.getEnrichCode(),
  },
  {
    role: 'user',
    content: USER_PROMPT(assistantMessage.getStep(2)),
  },
];
