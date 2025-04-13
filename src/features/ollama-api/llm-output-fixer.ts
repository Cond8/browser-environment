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
        });
      } else if (parsed && typeof parsed === 'object' && 'service' in parsed) {
        parsed.service = extractFirstWord(parsed.service);
        console.log('Extracted first word for service (object):', parsed.service);
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
