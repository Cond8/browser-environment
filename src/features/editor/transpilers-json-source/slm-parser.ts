import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { jsonrepair } from 'jsonrepair';

interface SlmSection {
  type: 'markdown' | 'json';
  content: string;
  parsed?: WorkflowStep;
}

interface ParsedSlm {
  markdown: {
    goal?: string;
    inputs?: string;
    outputs?: string;
    plan?: string[];
  };
  steps: WorkflowStep[];
}

export function parseSlm(content: string): ParsedSlm {
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
      // Try to repair the JSON if it's incomplete
      try {
        const repaired = jsonrepair(buffer);
        currentSection.content = repaired;
        currentSection.parsed = JSON.parse(repaired) as WorkflowStep;
      } catch (e) {
        console.error('Failed to repair final JSON block:', e);
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
      currentSection.parsed = JSON.parse(buffer.trim()) as WorkflowStep;
    } catch (e) {
      // If direct parsing fails, try to repair the JSON
      try {
        const repaired = jsonrepair(buffer.trim());
        currentSection.content = repaired;
        currentSection.parsed = JSON.parse(repaired) as WorkflowStep;
      } catch (repairError) {
        console.error('Failed to parse or repair JSON:', repairError);
      }
    }

    sections.push(currentSection);
    buffer = '';
    currentSection = null;
    inJsonBlock = false;
    braceDepth = 0;
  }

  // Process sections into final structure
  const result: ParsedSlm = {
    markdown: {},
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
          result.markdown[currentMarkdownSection] = (current + '\n' + content) as any;
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
