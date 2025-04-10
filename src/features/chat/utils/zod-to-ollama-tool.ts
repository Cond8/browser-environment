import { z } from 'zod';
import { OllamaTool } from '../services/ollama-wrapper';

export function zodToOllamaTool(
  schema: z.ZodType<any>,
  name: string,
  description: string,
): OllamaTool {
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
    let description: string | undefined;
    let enumValues: string[] | undefined;

    if (value instanceof z.ZodString) {
      type = 'string';
      description = value.description;
    } else if (value instanceof z.ZodNumber) {
      type = 'number';
      description = value.description;
    } else if (value instanceof z.ZodBoolean) {
      type = 'boolean';
      description = value.description;
    } else if (value instanceof z.ZodEnum) {
      type = 'string';
      enumValues = value.options;
      description = value.description;
    } else if (value instanceof z.ZodArray) {
      type = 'array';
      description = value.description;
    } else if (value instanceof z.ZodObject) {
      type = 'object';
      description = value.description;
    } else {
      throw new Error(`Unsupported Zod type: ${value.constructor.name}`);
    }

    properties[key] = {
      type,
      description,
      ...(enumValues && { enum: enumValues }),
    };

    if (!value.isOptional()) {
      required.push(key);
    }
  }

  return {
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
  };
}
