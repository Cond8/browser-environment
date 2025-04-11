// src/features/chat/tools/problem-solver.ts
import { z } from 'zod';
import { zodToOllamaTool } from '../services/zod-to-ollama-tool';

// Domain-specific class names with descriptions
const domainClasses = {
  // Data Operations
  database: 'Database operations and queries',
  parser: 'Data parsing and transformation',
  transformer: 'Data transformation and conversion',
  normalizer: 'Data normalization and standardization',
  extractor: 'Data extraction and parsing',
  aggregator: 'Data aggregation and summarization',
  loader: 'Data loading and importing',
  saver: 'Data saving and exporting',

  // Validation & Quality
  validator: 'Data validation and verification',
  sanitizer: 'Data cleaning and sanitization',
  verifier: 'Data integrity verification',
  auditor: 'Change tracking and auditing',

  // Processing
  processor: 'Data processing and manipulation',
  calculator: 'Mathematical calculations and computations',
  analyzer: 'Data analysis and insights',
  generator: 'Data generation and creation',

  // External Integration
  api: 'External API interactions',
  fetcher: 'Data retrieval operations',
  integrator: 'System integration operations',
  communicator: 'Inter-system communication',
  synchronizer: 'Data synchronization',

  // Presentation & Formatting
  formatter: 'Data formatting and presentation',
  selector: 'Data filtering and selection',
  enricher: 'Data enrichment and augmentation',

  // Decision Making & Control
  decider: 'Condition-based decision making',
  controller: 'Workflow state management',
  evaluator: 'Condition and rule evaluation',

  // Resource Management
  allocator: 'Resource allocation and management',
  optimizer: 'Resource usage optimization',
  balancer: 'Load balancing and distribution',

  // Security & Compliance
  authenticator: 'Authentication and authorization',
  encryptor: 'Data encryption and security',
  compliance: 'Regulatory compliance checks',
  protector: 'Data protection and privacy',

  // System Operations
  router: 'Request routing and handling',
  notifier: 'Notification and messaging',
  scheduler: 'Task scheduling and timing',
  logger: 'Logging and monitoring',
  cache: 'Caching and temporary storage',
  matcher: 'Pattern matching and comparison',
} as const;

export type Domain = keyof typeof domainClasses;

// Base schema for both steps and interfaces
const baseStepSchema = z.object({
  name: z
    .string()
    .regex(/^[A-Z][a-zA-Z]+$/)
    .describe('CamelCase name'),
  goal: z.string().describe('What this step aims to accomplish'),
  input: z.array(z.string()).describe('Array of input parameters needed'),
  output: z.array(z.string()).describe('Array of expected output values'),
  domain: z
    .string()
    .refine((val): val is Domain => val in domainClasses)
    .describe('Domain-specific class name'),
  tool: z
    .string()
    .regex(/^[a-z][a-zA-Z]+$/)
    .describe('Specific tool/method to call within the domain'),
});

// Schema for workflow steps
const stepSchema = baseStepSchema.extend({
  isInterface: z.literal(false).optional(),
});

// Schema for interfaces (the main input/output contract)
const interfaceSchema = baseStepSchema.extend({
  isInterface: z.literal(true),
  originalStep: baseStepSchema
    .optional()
    .describe('The step that triggered this interface creation'),
});

export type Step = z.infer<typeof stepSchema>;
export type Interface = z.infer<typeof interfaceSchema>;

export const problemSolverTool = zodToOllamaTool(
  z.object({
    interface: interfaceSchema.describe('The main input/output contract of the workflow'),
    steps: z
      .array(stepSchema)
      .min(1)
      .max(12)
      .describe('Array of 1-12 sequential steps to solve the problem'),
  }),
  'problem_solver',
  'Solve a problem using a structured, step-by-step approach with hierarchical steps',
);

// Helper functions
export function createStep(
  name: string,
  goal: string,
  domain: Domain,
  tool: string,
  input: string[],
  output: string[],
): Step {
  return {
    name,
    goal,
    domain,
    tool,
    input,
    output,
    isInterface: false,
  };
}

export function createInterface(
  name: string,
  goal: string,
  domain: Domain,
  tool: string,
  input: string[],
  output: string[],
  originalStep?: Step,
): Interface {
  return {
    name,
    goal,
    domain,
    tool,
    input,
    output,
    isInterface: true,
    ...(originalStep && { originalStep }),
  };
}

// Export domain classes for reference
export { domainClasses };
