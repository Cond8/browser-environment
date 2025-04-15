import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { jsonrepair } from 'jsonrepair';

function transformToInterface(input: string): string {
  try {
    // First try to parse whatever we have
    const parsed = JSON.parse(input);

    // If it's already in the correct format, return it
    if (parsed.interface) {
      return input;
    }

    // Transform to the expected interface structure
    const transformed = {
      interface: {
        name: parsed.name || parsed.interface?.name || 'UnnamedWorkflow',
        service: parsed.service || parsed.interface?.service || 'extract',
        method: parsed.method || parsed.interface?.method || 'process',
        goal: parsed.goal || parsed.interface?.goal || 'Process workflow',
        params: parsed.params || parsed.interface?.params || {},
        returns: parsed.returns || parsed.interface?.returns || {},
      },
    };

    // Ensure PascalCase for name
    transformed.interface.name = transformed.interface.name
      .split(/\s+/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    // Ensure snake_case for method
    transformed.interface.method = transformed.interface.method
      .split(/\s+/)
      .join('_')
      .toLowerCase();

    // Ensure valid service
    const validServices = [
      'extract',
      'parse',
      'validate',
      'transform',
      'logic',
      'calculate',
      'format',
      'io',
      'storage',
      'integrate',
      'understand',
      'generate',
    ];
    if (!validServices.includes(transformed.interface.service)) {
      transformed.interface.service = 'extract';
    }

    // Ensure params and returns have correct structure
    const ensureParamStructure = (obj: any) => {
      const result: Record<string, { type: string; description: string }> = {};
      Object.entries(obj).forEach(([key, value]: [string, any]) => {
        result[key] = {
          type: value.type || 'string',
          description: value.description || `Description for ${key}`,
        };
      });
      return result;
    };

    transformed.interface.params = ensureParamStructure(transformed.interface.params);
    transformed.interface.returns = ensureParamStructure(transformed.interface.returns);

    return JSON.stringify(transformed);
  } catch (error) {
    // If we can't parse or transform, return a minimal valid interface
    return JSON.stringify({
      interface: {
        name: 'DefaultWorkflow',
        service: 'extract',
        method: 'process',
        goal: 'Process workflow',
        params: {},
        returns: {},
      },
    });
  }
}

export function fixJson(input: string): WorkflowStep {
  // Tier 1: Direct parse
  try {
    return JSON.parse(input) as WorkflowStep;
  } catch (error) {
    console.log('Tier 1 parse failed, trying tier 2...');
  }

  // Tier 2: Library fix then parse
  try {
    const repairedJson = jsonrepair(input);
    return JSON.parse(repairedJson) as WorkflowStep;
  } catch (error) {
    console.log('Tier 2 parse failed, trying tier 3...');
  }

  // Tier 3: Transform to interface structure
  try {
    const transformed = transformToInterface(input);
    return JSON.parse(transformed) as WorkflowStep;
  } catch (error) {
    console.error('All JSON fixing tiers failed');
    throw new Error('Failed to fix JSON after all attempts: ' + (error as Error).message);
  }
}
