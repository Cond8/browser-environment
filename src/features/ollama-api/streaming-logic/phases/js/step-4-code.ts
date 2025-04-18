// src/features/ollama-api/streaming-logic/phases/js/step-4-code.ts
import { Message } from 'ollama';
import { AssistantMessage } from '../../../../chat/models/assistant-message';
import { WorkflowStep } from '../types';

const examples: string[] = [
  'function formatDate(date) {\n  return new Date(date).toLocaleDateString();\n}',
  'function formatUserSummary(user) {\n  return `${user.name} (${user.email}) - Joined: ${user.joined}`;\n}',
  "function toCSV(items) {\n  return items.map(row => row.join(',')).join('\\n');\n}",
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
You are implementing the **Format** step of a workflow.

This step uses output from the Decide step and structures it for delivery: clean, readable, and well-organized. Do not add new logic or data—just format, summarize, or prepare the output for consumption.

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
- Write a JavaScript function named "${functionName}" that formats or prepares the output for delivery.
- Do not include enrichment, analysis, or decision logic here.
- Output only the function code, nothing else.

function
`;
};

export const STEP_4_CODE_MESSAGES = (assistantMessage: AssistantMessage): Message[] => [
  {
    role: 'system',
    content: assistantMessage.getDecideCode(),
  },
  {
    role: 'user',
    content: USER_PROMPT(assistantMessage.getStep(4)),
  },
];
