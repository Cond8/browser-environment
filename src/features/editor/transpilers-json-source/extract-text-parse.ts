// src/features/editor/transpilers-json-source/extract-text-parse.ts
type SLMChunk = { type: 'text'; content: string } | { type: 'json'; content: unknown };

type SLMOutput = SLMChunk[];

export function extractTextParts(input: string): SLMOutput {
  const chunks: SLMOutput = [];
  let currentIndex = 0;

  // Regular expression to match code fences with optional json specifier
  const codeFenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/g;
  let match;

  while ((match = codeFenceRegex.exec(input)) !== null) {
    // Add text before the code fence if it exists
    const textBefore = input.substring(currentIndex, match.index).trim();
    if (textBefore) {
      chunks.push({ type: 'text', content: textBefore });
    }

    // Try to parse the JSON content
    const jsonContent = match[1].trim();
    try {
      const parsedJson = JSON.parse(jsonContent);
      chunks.push({ type: 'json', content: parsedJson });
    } catch {
      // If JSON parsing fails, treat it as text
      chunks.push({ type: 'text', content: jsonContent });
    }

    // Update the current index to after the code fence
    currentIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last code fence
  const remainingText = input.substring(currentIndex).trim();
  if (remainingText) {
    chunks.push({ type: 'text', content: remainingText });
  }

  return chunks;
}
