import { Interface, Step } from '../tools/problem-solver';
import { OllamaChatResponse } from './ollama-sdk';

// Process a tool response and extract AST
export const processToolResponse = (response: OllamaChatResponse): AST | null => {
  try {
    // Check if there are any tool calls in the message
    if (!response.message.tool_calls?.length) {
      return null;
    }

    // Find the problem_solver tool call
    const problemSolverCall = response.message.tool_calls.find(
      call => call.function.name === 'problem_solver',
    );

    if (!problemSolverCall) {
      return null;
    }

    // Parse the arguments
    const args = JSON.parse(problemSolverCall.function.arguments);

    // Extract interface and steps
    const { interface: workflowInterface, steps } = args;

    return {
      interface: workflowInterface as Interface,
      steps: steps as Step[],
      rawResponse: response.message.content,
      toolCalls: response.message.tool_calls,
    };
  } catch (error) {
    console.error('Error processing tool response:', error);
    return null;
  }
};

// Handle a tool response and update stores
export const handleToolResponse = (
  response: OllamaChatResponse,
  conversationId: string,
): AST | null => {
  const ast = processToolResponse(response);

  if (ast) {
    // Update workflow store
    const { setAst } = useWorkflowStore.getState();
    setAst(ast, conversationId);
  }

  return ast;
};

// Process domain tool generator response
export const processDomainToolResponse = (response: OllamaChatResponse): any => {
  try {
    // Check if there are any tool calls in the message
    if (!response.message.tool_calls?.length) {
      return null;
    }

    // Find the generateDomainTool tool call
    const generateToolCall = response.message.tool_calls.find(
      call => call.function.name === 'generateDomainTool',
    );

    if (!generateToolCall) {
      return null;
    }

    // Parse the arguments
    const args = JSON.parse(generateToolCall.function.arguments);

    return args.specification;
  } catch (error) {
    console.error('Error processing domain tool response:', error);
    return null;
  }
};
