// src/features/chat/services/zod-to-ollama-tool.ts
import { OllamaTool } from '@/lib/ollama';
import { z } from 'zod';

/**
 * Converts a Zod schema into an Ollama-compatible tool definition and parser.
 * Only flat ZodObject schemas with string/number/boolean/enum/array/object fields are supported.
 *
 * @param schema - The Zod schema to convert
 * @param name - The name of the tool function
 * @param description - The description of the tool function
 * @returns An object containing both the OllamaTool and the Zod parser
 * @throws Error if the schema is not a ZodObject or contains unsupported types
 */
export function zodToOllamaTool<T extends z.ZodType<any>>(
  schema: T,
  name: string,
  description: string,
): { tool: OllamaTool; parser: T } {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Schema must be a ZodObject');
  }

  const shape = schema.shape;
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    if (!(value instanceof z.ZodType)) {
      continue;
    }

    let type: string;
    let fieldDescription: string | undefined = value.description;
    let enumValues: string[] | undefined;
    let items: Record<string, any> | undefined;

    if (value instanceof z.ZodString) {
      type = 'string';
    } else if (value instanceof z.ZodNumber) {
      type = 'number';
    } else if (value instanceof z.ZodBoolean) {
      type = 'boolean';
    } else if (value instanceof z.ZodEnum) {
      type = 'string';
      enumValues = value.options;
    } else if (value instanceof z.ZodArray) {
      type = 'array';
      const elementType = value._def.type;
      if (elementType instanceof z.ZodString) {
        items = { type: 'string' };
      } else if (elementType instanceof z.ZodNumber) {
        items = { type: 'number' };
      } else if (elementType instanceof z.ZodBoolean) {
        items = { type: 'boolean' };
      }
    } else if (value instanceof z.ZodObject) {
      type = 'object';
    } else {
      throw new Error(`Unsupported Zod type: ${value.constructor.name} (for key "${key}")`);
    }

    properties[key] = {
      type,
      description: fieldDescription,
      ...(enumValues && { enum: enumValues }),
      ...(items && { items }),
    };

    if (!value.isOptional()) {
      required.push(key);
    }
  }

  return {
    tool: {
      type: 'function',
      function: {
        name,
        description,
        parameters: {
          type: 'object',
          properties,
          ...(required.length > 0 && { required }),
        },
      },
    },
    parser: schema,
  };
}
