// src/features/editor/transpilers-json-source/slm-parser.ts
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { EMPTY_PARSED_SLM, ParsedSlm } from '@/utils/workflow-helpers';
import { jsonrepair } from 'jsonrepair';

interface SlmSection {
  type: 'markdown' | 'json';
  content: string;
  parsed?: WorkflowStep;
}

export function parseSlm(content: string): ParsedSlm {
  if (!content || typeof content !== 'string') {
    console.warn('Invalid content provided to parseSlm');
    return EMPTY_PARSED_SLM;
  }

  const sections: SlmSection[] = [];
  let currentSection: SlmSection | null = null;
  let buffer = '';
  let inJsonBlock = false;
  let braceDepth = 0;

  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Check for markdown headers
    if (line.startsWith('### ')) {
      // Finish any current section
      if (inJsonBlock && buffer) {
        finishJsonBlock();
      } else if (buffer && currentSection) {
        currentSection.content = buffer.trim();
        sections.push(currentSection);
      }

      // Start a new markdown section
      buffer = line + '\n';
      currentSection = { type: 'markdown', content: buffer };
      inJsonBlock = false;
      i++;
      continue;
    }

    // Check for JSON blocks with code fence
    if (line.startsWith('```json')) {
      // Finish any current section
      if (buffer && currentSection) {
        currentSection.content = buffer.trim();
        sections.push(currentSection);
      }

      // Start a new JSON section
      buffer = '';
      currentSection = { type: 'json', content: '' };
      inJsonBlock = true;
      i++;
      continue;
    }

    // Check for end of JSON block with code fence
    if (line === '```' && inJsonBlock) {
      finishJsonBlock();
      i++;
      continue;
    }

    // Check for standalone JSON objects (starting with '{')
    if (line.startsWith('{') && !inJsonBlock) {
      // Finish any current section
      if (buffer && currentSection) {
        currentSection.content = buffer.trim();
        sections.push(currentSection);
      }

      // Start a new JSON section
      buffer = line + '\n';
      currentSection = { type: 'json', content: buffer };
      inJsonBlock = true;
      braceDepth = countBraces(line);

      // If it's a complete JSON object in one line
      if (braceDepth === 0) {
        finishJsonBlock();
      }

      i++;
      continue;
    }

    // Handle content within a section
    if (currentSection) {
      // If we're in a JSON block, track braces
      if (inJsonBlock) {
        buffer += line + '\n';
        if (line) {
          braceDepth += countBraces(line);

          // If brace depth is 0, we've completed a JSON object
          if (braceDepth === 0 && buffer.trim()) {
            finishJsonBlock();
          }
        }
      } else {
        // Regular markdown content
        buffer += line + '\n';
      }
    } else if (line) {
      // Start a new section if we have content but no current section
      if (line.startsWith('{')) {
        // Looks like JSON
        currentSection = { type: 'json', content: line + '\n' };
        inJsonBlock = true;
        braceDepth = countBraces(line);
      } else {
        // Treat as markdown
        currentSection = { type: 'markdown', content: line + '\n' };
      }
      buffer = line + '\n';
    }

    i++;
  }

  // Handle any remaining content
  if (buffer && currentSection) {
    if (inJsonBlock) {
      // Force repair for final incomplete JSON blocks
      try {
        if (braceDepth > 0) {
          // Add missing closing braces if needed
          buffer += '}'.repeat(braceDepth);
        }

        const repaired = jsonrepair(buffer);
        currentSection.content = repaired;
        try {
          currentSection.parsed = JSON.parse(repaired) as WorkflowStep;
        } catch (parseError: unknown) {
          console.log('[SLM Parser] Failed to parse JSON:', (parseError as Error)?.message);
          // If parse still fails, just treat as markdown
          currentSection.type = 'markdown';
          currentSection.content = buffer.trim();
        }
      } catch (repairError: unknown) {
        console.log('[SLM Parser] Failed to repair JSON:', (repairError as Error)?.message);
        // If repair fails, treat it as markdown
        currentSection.type = 'markdown';
        currentSection.content = buffer.trim();
      }
    } else {
      currentSection.content = buffer.trim();
    }
    sections.push(currentSection);
  }

  // Helper function to finish a JSON block
  function finishJsonBlock() {
    if (!currentSection || !buffer.trim()) return;

    try {
      // Try direct parsing first
      currentSection.content = buffer.trim();
      try {
        currentSection.parsed = JSON.parse(buffer.trim()) as WorkflowStep;
      } finally {
        // If direct parsing fails, try to repair the JSON
        try {
          const repaired = jsonrepair(buffer.trim());
          currentSection.content = repaired;
          currentSection.parsed = JSON.parse(repaired) as WorkflowStep;
        } catch (repairError) {
          console.warn('Failed to parse or repair JSON:', repairError);
          // Instead of throwing, treat it as markdown
          currentSection.type = 'markdown';
          currentSection.content = buffer.trim();
        }
      }
    } catch (error) {
      console.warn('Error in finishJsonBlock:', error);
      currentSection.type = 'markdown';
      currentSection.content = buffer.trim();
    }

    sections.push(currentSection);
    buffer = '';
    currentSection = null;
    inJsonBlock = false;
    braceDepth = 0;
  }

  // Process sections into final structure
  const result: ParsedSlm = {
    markdown: {
      goal: undefined,
      inputs: undefined,
      outputs: undefined,
      plan: undefined,
    },
    steps: [],
  };

  let currentMarkdownSection: keyof ParsedSlm['markdown'] | null = null;

  for (const section of sections) {
    if (section.type === 'markdown') {
      const content = section.content.trim();
      if (content.startsWith('### Goal')) {
        currentMarkdownSection = 'goal';
        result.markdown.goal = content.replace('### Goal', '').trim();
      } else if (content.startsWith('### Inputs')) {
        currentMarkdownSection = 'inputs';
        result.markdown.inputs = content.replace('### Inputs', '').trim();
      } else if (content.startsWith('### Outputs')) {
        currentMarkdownSection = 'outputs';
        result.markdown.outputs = content.replace('### Outputs', '').trim();
      } else if (content.startsWith('### Plan')) {
        currentMarkdownSection = 'plan';
        const planText = content.replace('### Plan', '').trim();
        result.markdown.plan = planText
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
          .map(line => line.replace(/^\s*[-\d.]\s*/, '').trim());
      } else if (currentMarkdownSection) {
        // Append to current section if it exists
        const current = result.markdown[currentMarkdownSection];
        if (typeof current === 'string') {
          // For string types (goal, inputs, outputs)
          result.markdown[currentMarkdownSection] = (current + '\n' + content) as string & string[];
        } else if (Array.isArray(current)) {
          // For array types (plan)
          // Do nothing here since we've already processed the plan items
        }
      }
    } else if (section.type === 'json' && section.parsed) {
      result.steps.push(section.parsed);
    }
  }

  return result;
}

// Helper function to count net braces (opening minus closing)
function countBraces(text: string): number {
  let count = 0;
  for (const char of text) {
    if (char === '{') count++;
    if (char === '}') count--;
  }
  return count;
}
