import { chatFn } from '../../infra/create-chat';
import { WorkflowStep } from '../types';

const SYSTEM_PROMPT = (): string => `
You are a function generation engine. Your job is to write minimal, stateless JavaScript functions based on structured definitions.

Guidelines:
- Use the functionName as the identifier.
- Use the given parameter names and types.
- Return an object that matches the return signature.
- Do NOT include validation, logging, or external dependencies.
- Stub each return field as undefined or an empty string/array/object, depending on its type.
- No comments unless strictly necessary.
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

  return `
Function goal:
${goal}

Function signature:
Name: ${functionName}

Parameters:
${paramDefs}

Returns:
${returnDefs}

Write a complete JavaScript function named "${functionName}".
It should use the exact parameters listed and return an object matching the return fields.
`;
};

export async function* generateFunctionImplementation(
  step: WorkflowStep,
): AsyncGenerator<string, string, unknown> {
  return yield* chatFn({
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT(),
      },
      {
        role: 'user',
        content: USER_PROMPT(step),
      },
    ],
  });
}
