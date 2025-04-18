import { Message } from 'ollama';
import { AssistantMessage } from '../../../../chat/models/assistant-message';
import { useVFSStore } from '../../../../vfs/store/vfs-store';
import { chatFn } from '../../infra/create-chat';
import { WorkflowStep } from '../types';
import { STEP_1_MESSAGES } from './step-1-code';

const examples: string[] = [
  'function add(a, b) { return a + b; }',
  'function greet(name) { return `Hello, ${name}!`; }',
  'function getItems() { return ["apple", "banana", "orange"]; }',
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
You are implementing the **Decide** step of a workflow.

This step uses output from the Analyze step and performs branching, filtering, or outcome selection based on analysis. It determines the final path, classification, or selection for the workflow.

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
- Write a JavaScript function named "${functionName}" that performs branching, filtering, or outcome selection.
- Do not include enrichment, pure analysis, or formatting logic here.
- Output only the function code, nothing else.

function
`;
};

export const STEP_3_MESSAGES = (
  step: WorkflowStep,
  assistantMessage: AssistantMessage,
): Message[] => [
  {
    role: 'system',
    content: assistantMessage.getAnalyzeCode(),
  },
  {
    role: 'user',
    content: USER_PROMPT(step),
  },
];

export async function* generateDecideFunction(
  step: WorkflowStep,
  assistantMessage: AssistantMessage,
): AsyncGenerator<string, string, unknown> {
  const code = useVFSStore.getState().getServiceImplementation(step);
  if (code) {
    yield code;
    return '';
  }
  return yield* chatFn({
    messages: [...STEP_1_MESSAGES(step), ...STEP_3_MESSAGES(step, assistantMessage)],
  });
}
