import { Message } from 'ollama';
import { useVFSStore } from '../../../../vfs/store/vfs-store';
import { chatFn } from '../../infra/create-chat';
import { WorkflowStep } from '../types';

const examples: string[] = [
  'function add(a, b) { return a + b; }',
  'function greet(name) { return `Hello, ${name}!`; }',
  'function getItems() { return ["apple", "banana", "orange"]; }',
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

export const STEP_1_MESSAGES = (step: WorkflowStep): Message[] => [
  {
    role: 'system',
    content: SYSTEM_PROMPT(),
  },
  {
    role: 'user',
    content: USER_PROMPT(step),
  },
];

export async function* generateEnrichFunction(
  step: WorkflowStep,
): AsyncGenerator<string, string, unknown> {
  const code = useVFSStore.getState().getServiceImplementation(step);
  if (code) {
    yield code;
    return '';
  }
  return yield* chatFn({ messages: STEP_1_MESSAGES(step) });
}
