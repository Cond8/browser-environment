// src/features/chat/services/prompts-tools.ts
export const TOOL_PROMPT_INTERFACE_PHASE = (
  userMessage: string,
) => `You are an AI assistant that defines structured YAML workflows in a recursive multi-phase process.

You are currently in the **Interface Phase**, where your task is to define the initial shape of the workflow.

This phase may repeat multiple times as part of an iterative refinement process.

## Task

${userMessage.trim()}

## Rules:

- ONLY generate the **interface** section of the YAML workflow.
- DO NOT generate steps.
- DO NOT include comments, Markdown, or explanations.
- Assume all methods will exist and function.
- Prefer programmatic classes unless LLM-based reasoning is required.
- The interface defines the goal, scope, and structure of the workflow. It will be passed to a second phase that generates the steps.

## Interface Format

interface:
  name: CamelCaseName
  goal: Short description of the workflow’s purpose
  input:
    - variable (brief comment)
  output:
    - variable (brief comment)
  class: one of the domain classes below
  method: camelCaseMethod (optional inline comment)

## Available Classes:

### programmatic
- Simple: data, validate, io, storage, logic
- Complex: parse, control, auth, notify, schedule, optimize, calculate, network, encrypt

### llm_based
- Simple: extract, format, understand
- Complex: process, generate, integrate, predict, transform

ONLY generate the interface block. Do not generate steps.
`;

export const TOOL_PROMPT_STEPS_PHASE =
  () => `You are an AI assistant defining structured YAML workflows in a recursive multi-phase process.

You are currently in the **Steps Phase**, where your task is to generate the workflow steps based on a previously defined interface.

This phase may repeat as the interface evolves.

## Step Format

Each step must include:

- **name**: Short CamelCase identifier (e.g., \`ValidateInput\`)
- **goal**: One clear and specific purpose
- **input**: List of required inputs
- **output**: List of expected outputs
- **class**: Domain category (from the provided list)
- **method**: camelCase identifier (optional inline comment)

## Constraints

- Define between 8 and 12 steps total.
- Steps must follow a logical, sequential progression.
- Each step must represent a single, atomic action.
- The final step must produce all outputs declared in the interface.
- Prefer **programmatic** classes for deterministic logic.
- Use **llm_based** classes only when subjective judgment or inference is required.
- Do NOT repeat or include the interface section.
- Do NOT include any Markdown, comments, or explanation — output valid YAML only.
`;
