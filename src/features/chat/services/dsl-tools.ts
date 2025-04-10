import { tool } from 'ai';
import { z } from 'zod';
import { useChatSettingsStore } from '../store/chat-settings-store';
import { OllamaConnectionService } from './ollama-sdk';

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

type DomainClass = keyof typeof domainClasses;

// Schema for workflow steps
const stepSchema = z.object({
  name: z
    .string()
    .regex(/^[A-Z][a-zA-Z]+$/)
    .describe('CamelCase name'),
  goal: z.string().describe('What this step aims to accomplish'),
  input: z.array(z.string()).describe('Array of input parameters needed'),
  output: z.array(z.string()).describe('Array of expected output values'),
  domain: z
    .string()
    .refine((val): val is DomainClass => val in domainClasses)
    .describe('Domain-specific class name'),
  tool: z
    .string()
    .regex(/^[a-z][a-zA-Z]+$/)
    .describe('Specific tool/method to call within the domain'),
});

// Schema for tool generation
const toolGenerationSchema = z.object({
  name: z.string().describe('Name of the tool to generate'),
  description: z.string().describe('Description of what the tool does'),
  input: z.array(z.string()).describe('Array of input parameters needed'),
  output: z.array(z.string()).describe('Array of expected output values'),
  domain: z
    .string()
    .refine((val): val is DomainClass => val in domainClasses)
    .describe('Domain-specific class name'),
});

export const DSLTools = {
  streamTools: tool({
    description: 'Stream tool JSON output for the workflow steps.',
    parameters: z.object({
      steps: z
        .array(stepSchema)
        .min(1)
        .max(12)
        .describe('Array of 1-12 sequential steps to solve the problem'),
    }),
    execute: async ({ steps }) => {
      return {
        success: true,
        tools: {
          steps,
        },
      };
    },
  }),

  generateDomainTool: tool({
    description: 'Generate a domain-specific tool based on input/output specifications.',
    parameters: z.object({
      specification: toolGenerationSchema,
    }),
    execute: async ({ specification }) => {
      const { name, description, input, output, domain } = specification;
      const { ollamaUrl, assistantSettings } = useChatSettingsStore.getState();

      // Create Ollama connection
      const ollama = new OllamaConnectionService(ollamaUrl, assistantSettings.model);

      // Get the implementation from Ollama
      let implementation = '';
      await ollama.sendMessageStream(
        [
          {
            role: 'user',
            content: `Generate a ${domain} implementation for a function that:
            - Takes input: ${input.join(', ')}
            - Produces output: ${output.join(', ')}
            - Purpose: ${description}
            
            You are allowed to:
            1. Create and use helper functions
            2. Import and use any npm packages (include imports inline)
            3. Use any JavaScript features
            4. Make assumptions about available functions and APIs
            
            Important:
            - Include all required imports directly in the code
            - Use dynamic imports if needed: const pkg = await import('package-name')
            - The code must be self-contained and runnable after eval()
            
            Return only the implementation code, no function definition or explanations.
            The code should be valid JavaScript that can be evaluated directly.`,
          },
        ],
        response => {
          implementation += response.message.content;
        },
        error => {
          console.error('Error generating implementation:', error);
        },
      );

      return {
        success: true,
        code: `async function ${name}(${input.join(', ')}) {
          // ${description}
          // Input: ${input.join(', ')}
          // Output: ${output.join(', ')}
          
          ${implementation}
        }`,
      };
    },
  }),
} as const;

// Type for the tool results
export type StreamToolsResult = {
  success: boolean;
  tools: {
    steps: z.infer<typeof stepSchema>[];
  };
};

// Helper type to extract tool call types
export type DSLToolSet = typeof DSLTools;

// Export domain classes for reference
export { domainClasses };
