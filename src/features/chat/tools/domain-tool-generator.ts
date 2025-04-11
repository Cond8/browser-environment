// src/features/chat/tools/domain-tool-generator.ts
import { z } from 'zod';
import { zodToOllamaTool } from '../utils/zod-to-ollama-tool';
import { Domain, domainClasses, Interface, Step } from './problem-solver';

// Schema for tool generation
export const toolGenerationSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z][a-zA-Z]+$/)
    .describe('Function name in camelCase'),
  description: z.string().describe("Clear explanation of the tool's purpose"),
  input: z.array(z.string()).describe('Array of input parameter names'),
  output: z.array(z.string()).describe('Array of expected output values'),
  domain: z
    .string()
    .refine((val): val is Domain => val in domainClasses)
    .describe('Domain-specific class name'),
  isInterface: z
    .boolean()
    .describe('Whether this is an interface (main contract) or a step (internal transformation)'),
  originalStep: z
    .any()
    .optional()
    .describe('The original step that triggered this tool generation, if applicable'),
});

export type ToolGenerationSpec = z.infer<typeof toolGenerationSchema>;

export const domainToolGeneratorTool = zodToOllamaTool(
  z.object({
    specification: toolGenerationSchema,
  }),
  'generateDomainTool',
  'Generate a domain-specific implementation based on specifications',
);

export function createToolSpec(
  name: string,
  description: string,
  domain: Domain,
  input: string[],
  output: string[],
  isInterface: boolean,
  originalStep?: Step | Interface,
): ToolGenerationSpec {
  return {
    name,
    description,
    domain,
    input,
    output,
    isInterface,
    ...(originalStep && { originalStep }),
  };
}

// Helper function to generate implementation code
export async function generateImplementation(
  spec: ToolGenerationSpec,
  ollama: any, // Replace with your Ollama service type
): Promise<string> {
  const prompt = `Generate a ${spec.domain} implementation for a ${spec.isInterface ? 'interface' : 'step'} that:
- Takes input: ${spec.input.join(', ')}
- Produces output: ${spec.output.join(', ')}
- Purpose: ${spec.description}
${spec.isInterface ? '- This is an interface (main contract) for the workflow' : '- This is an internal transformation step'}

You are allowed to:
1. Create and use helper functions
2. Import and use any npm packages (include imports inline)
3. Use any JavaScript features
4. Make assumptions about available functions and APIs

Important:
- Include all required imports directly in the code
- Use dynamic imports if needed: const pkg = await import('package-name')
- The code must be self-contained and runnable after eval()
- Include error handling and input validation
- Document the code with comments
- Consider edge cases
${spec.isInterface ? '- This is the main interface, so ensure robust error handling and input validation' : ''}

Return only the implementation code, no function definition or explanations.
The code should be valid JavaScript that can be evaluated directly.`;

  let implementation = '';
  await ollama.sendMessageStream(
    [{ role: 'user', content: prompt }],
    (response: any) => {
      implementation += response.message.content;
    },
    (error: any) => {
      console.error('Error generating implementation:', error);
    },
  );

  return `async function ${spec.name}(${spec.input.join(', ')}) {
    // ${spec.description}
    // ${spec.isInterface ? 'Interface (main contract)' : 'Internal transformation step'}
    // Input: ${spec.input.join(', ')}
    // Output: ${spec.output.join(', ')}
    
    ${implementation}
  }`;
}
