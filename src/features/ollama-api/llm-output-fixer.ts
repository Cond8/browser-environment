// src/features/ollama-api/llm-output-fixer.ts
import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';

/**
 * Removes markdown code block markers from a string if present.
 *
 * @param text The text potentially containing markdown code blocks
 * @returns The text with code block markers removed
 */
function removeCodeBlocks(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
}

/**
 * Extracts the first word from a string, handling various case formats.
 *
 * @param text The text to extract the first word from
 * @returns The first word in lowercase, or the original string if empty/null
 */
function extractFirstWord(text: string | undefined | null): string {
  if (!text) return '';

  // Handle snake_case
  if (text.includes('_')) {
    return text.split('_')[0].toLowerCase();
  }

  // Handle PascalCase and camelCase
  const words = text.match(/[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|$)|\d+/g);
  return words ? words[0].toLowerCase() : text.toLowerCase();
}

/**
 * Fixes param and return type formats to match the expected format with type and description fields
 *
 * @param obj The workflow step object to fix
 * @returns The fixed workflow step object
 */
function fixParamAndReturnFormats(obj: any): any {
  // Helper to fix an individual param/return value
  const fixTypeValue = (value: any): { type: string; description: string } => {
    // If it's already in the correct format (object with type and description)
    if (value && typeof value === 'object' && 'type' in value && 'description' in value) {
      return value;
    }

    // If it's a string in the old "type - description" format
    if (typeof value === 'string') {
      // If it already follows the format "type - description", parse it
      const match = /^(string|number|boolean|function|object|array) - (.+)/i.exec(value);
      if (match) {
        return {
          type: match[1],
          description: match[2],
        };
      }

      // Map simple type names to the proper object format
      const typeMap: Record<string, { type: string; description: string }> = {
        text: { type: 'string', description: 'Text value' },
        string: { type: 'string', description: 'Text value' },
        number: { type: 'number', description: 'Numeric value' },
        boolean: { type: 'boolean', description: 'Boolean value' },
        function: { type: 'function', description: 'Function value' },
        object: { type: 'object', description: 'Object value' },
        array: { type: 'array', description: 'Array value' },
      };

      if (typeMap[value]) {
        return typeMap[value];
      }

      // Default fallback - assume it's the description part and prefix with string type
      return { type: 'string', description: value };
    }

    // If it's an array or other non-string type
    if (Array.isArray(value)) {
      return {
        type: 'array',
        description: JSON.stringify(value),
      };
    }

    // Default for other non-string types (e.g., object)
    return {
      type: 'object',
      description: typeof value === 'object' ? JSON.stringify(value) : String(value),
    };
  };

  // Clone the object to avoid modifying the original
  const result = { ...obj };

  // Fix params if present
  if (result.params && typeof result.params === 'object') {
    for (const key in result.params) {
      result.params[key] = fixTypeValue(result.params[key]);
    }
  }

  // Fix returns if present
  if (result.returns && typeof result.returns === 'object') {
    for (const key in result.returns) {
      result.returns[key] = fixTypeValue(result.returns[key]);
    }
  }

  return result;
}

/**
 * Tries to parse a string as JSON, attempting repairs if necessary.
 *
 * @param text The raw text from the LLM, potentially containing malformed JSON and markdown blocks.
 * @param schema Optional Zod schema to validate the parsed JSON against.
 * @returns The parsed and validated JSON object/array, or null if parsing or validation fails.
 */
export function parseOrRepairJson<T = unknown>(text: string, schema?: z.ZodType<T>): T | null {
  const cleanedText = removeCodeBlocks(text);
  console.log('Cleaned text:', cleanedText);

  const parseAndValidate = (jsonString: string): T | null => {
    try {
      console.log('Attempting JSON parse...');
      let parsed = JSON.parse(jsonString) as any; // Parse as any initially
      console.log('Parse successful:', parsed);

      // Modify the service field(s) to only contain the first word
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item && typeof item === 'object' && 'service' in item) {
            item.service = extractFirstWord(item.service);
            console.log('Extracted first word for service (array item):', item.service);
          }
          // Fix param and return formats
          parsed = fixParamAndReturnFormats(item);
        });
      } else if (parsed && typeof parsed === 'object') {
        if ('service' in parsed) {
          parsed.service = extractFirstWord(parsed.service);
          console.log('Extracted first word for service (object):', parsed.service);
        }
        // Fix param and return formats
        parsed = fixParamAndReturnFormats(parsed);
      }

      // If a schema is provided, validate against it
      if (schema) {
        console.log('Validating against schema...');
        parsed = schema.parse(parsed);
        console.log('Schema validation successful');
        return parsed as T;
      }

      return parsed as T;
    } catch (error) {
      console.log('Parse or validation failed:', error);
      return null;
    }
  };

  // Try direct parse and validation first
  let result = parseAndValidate(cleanedText);
  if (result !== null) {
    return result;
  }

  // If direct parse failed, attempt repair
  console.log('Direct parse/validation failed, attempting repair...');
  try {
    const repairedJson = jsonrepair(cleanedText);
    console.log('Repaired JSON:', repairedJson);
    result = parseAndValidate(repairedJson);
    if (result !== null) {
      return result;
    }
  } catch (repairError) {
    console.error('JSON repair itself failed:', repairError);
  }

  // If both attempts fail, log the final error
  console.error('Failed to parse JSON even after repair and first-word extraction attempt:', {
    originalText: text,
    cleanedText,
  });
  return null;
}
