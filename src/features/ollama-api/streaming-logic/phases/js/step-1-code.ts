import { Message } from 'ollama';
import { WorkflowStep } from '../types';

const examples: string[] = [
  'async function fetchUserProfile(userId) {\n  const response = await fetch(`/api/users/${userId}`);\n  return await response.json();\n}',
  "function generateRandomToken(length) {\n  return Array.from({length}, () => Math.floor(Math.random()*36).toString(36)).join('');\n}",
  "function loadConfig() {\n  return require('./config.json');\n}",
];

const SYSTEM_PROMPT = (): string => `
You are implementing the **Enrich** step of a workflow.

This step is responsible for gathering or synthesizing new information that is not yet present. It may call external APIs, perform lookups, or load data from persistent sources. Think of this step as expanding the input with valuable context or facts needed for subsequent reasoning.

- Focus on enriching the input data.
- Do not include business logic or analysis here.
- No explanations—just return the function as JavaScript code.
`;

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
You are a JavaScript developer. Your task is to implement the following function.

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
- Write a complete JavaScript function named "${functionName}".
- Use the exact parameters listed and return an object matching the return fields.
- Implement the full logic to achieve the function goal, not just a template.
- Think step by step and reason about the problem before coding.
- Output only the function code, nothing else.

function
`;
};

export const STEP_1_CODE_MESSAGES = (step: WorkflowStep): Message[] => [
  {
    role: 'system',
    content: SYSTEM_PROMPT(),
  },
  {
    role: 'user',
    content: USER_PROMPT(step),
  },
];
