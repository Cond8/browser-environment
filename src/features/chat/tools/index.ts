// src/features/chat/tools/index.ts

export * from './domain-tool-generator';
export * from './problem-solver';

// Export all tools in an array for easy use with Ollama
import { domainToolGeneratorTool } from './domain-tool-generator';
import { problemSolverTool } from './problem-solver';

export const allTools = [problemSolverTool, domainToolGeneratorTool];
