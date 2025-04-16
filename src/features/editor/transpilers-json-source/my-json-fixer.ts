// src/features/editor/transpilers-json-source/my-json-fixer.ts
export function transformToInterface(input: string): string {
  try {
    // First try to parse whatever we have
    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch (parseError) {
      throw new Error(`Invalid JSON input: ${(parseError as Error).message}`);
    }

    // If it's already in the correct format, return it
    if (parsed.interface) {
      return input;
    }

    // Validate required fields
    if (!parsed.name && !parsed.interface?.name) {
      throw new Error('Missing required field: name');
    }

    // Transform to the expected interface structure
    const transformed = {
      interface: {
        name: parsed.name || parsed.interface?.name || 'UnnamedWorkflow',
        module: parsed.module || parsed.interface?.module || 'extract',
        functionName: parsed.functionName || parsed.interface?.functionName || 'process',
        goal: parsed.goal || parsed.interface?.goal || 'Process workflow',
        params: parsed.params || parsed.interface?.params || {},
        returns: parsed.returns || parsed.interface?.returns || {},
      },
    };

    // Ensure PascalCase for name
    try {
      transformed.interface.name = transformed.interface.name
        .split(/\s+/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    } catch (nameError) {
      throw new Error(`Failed to format name to PascalCase: ${(nameError as Error).message}`);
    }

    // Ensure snake_case for function
    try {
      transformed.interface.functionName = transformed.interface.functionName
        .split(/\s+/)
        .join('_')
        .toLowerCase();
    } catch (functionError) {
      throw new Error(
        `Failed to format functionName to snake_case: ${(functionError as Error).message}`,
      );
    }

    // Ensure valid module
    const validModules = [
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
    if (!validModules.includes(transformed.interface.module)) {
      throw new Error(
        `Invalid module: ${transformed.interface.module}. Must be one of: ${validModules.join(', ')}`,
      );
    }

    // Ensure params and returns have correct structure
    const ensureParamStructure = (obj: any, paramType: 'params' | 'returns') => {
      try {
        const result: Record<string, { type: string; description: string }> = {};
        Object.entries(obj).forEach(([key, value]: [string, any]) => {
          if (typeof value !== 'object' || value === null) {
            throw new Error(`Invalid ${paramType} structure for key '${key}': must be an object`);
          }
          result[key] = {
            type: value.type || 'string',
            description: value.description || `Description for ${key}`,
          };
        });
        return result;
      } catch (paramError) {
        throw new Error(`Failed to process ${paramType}: ${(paramError as Error).message}`);
      }
    };

    try {
      transformed.interface.params = ensureParamStructure(transformed.interface.params, 'params');
      transformed.interface.returns = ensureParamStructure(
        transformed.interface.returns,
        'returns',
      );
    } catch (structureError) {
      throw new Error(
        `Failed to process interface structure: ${(structureError as Error).message}`,
      );
    }

    return JSON.stringify(transformed);
  } catch (error) {
    // If we can't parse or transform, return a minimal valid interface with error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return JSON.stringify({
      interface: {
        name: 'DefaultWorkflow',
        module: 'extract',
        functionName: 'process',
        goal: 'Process workflow',
        params: {},
        returns: {},
        error: {
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
}
