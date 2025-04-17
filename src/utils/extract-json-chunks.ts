// src/utils/extract-json-chunks.ts
import { processJsonChunk } from '@/features/editor/transpilers-json-source/my-json-parser';
import { AssistantChunk, WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';

export function extractJsonChunks(content: string): AssistantChunk[] {
  const chunks: (string | WorkflowStep)[] = [];
  let buffer = '';
  let insideJson = false;
  let insideCodeFence = false;
  let braceDepth = 0;

  const flushBuffer = () => {
    const trimmed = buffer.trim();
    if (trimmed) {
      if (insideJson) {
        try {
          chunks.push(processJsonChunk(trimmed));
        } catch {
          chunks.push(trimmed); // fallback to raw markdown
        }
      } else {
        chunks.push(trimmed);
      }
    }
    buffer = '';
  };

  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for code fence start
    if (line.trim().startsWith('```')) {
      if (!insideCodeFence) {
        // Start of a code fence
        insideCodeFence = true;

        // Check if it's a JSON code fence
        if (line.trim().startsWith('```json')) {
          if (buffer) {
            flushBuffer(); // Flush any accumulated markdown
          }
          insideJson = true;
          braceDepth = 0;
          i++; // Skip the code fence line
          continue;
        } else {
          buffer += line + '\n';
        }
      } else {
        // End of a code fence
        insideCodeFence = false;
        buffer += line + '\n';

        if (insideJson) {
          insideJson = false;
          flushBuffer();
        }
      }
      i++;
      continue;
    }

    // If we're inside a code fence, just add the line to buffer
    if (insideCodeFence) {
      buffer += line + '\n';
      i++;
      continue;
    }

    // Handle standalone JSON objects
    if (line.trim().startsWith('{')) {
      if (buffer) {
        flushBuffer();
      }
      insideJson = true;
      braceDepth = 1;
      buffer = line + '\n';
    } else if (insideJson) {
      buffer += line + '\n';
      if (line.includes('{')) braceDepth++;
      if (line.includes('}')) braceDepth--;
      if (braceDepth === 0) {
        insideJson = false;
        flushBuffer();
      }
    } else {
      // Regular markdown line
      buffer += line + '\n';
    }

    i++;
  }

  flushBuffer(); // catch any leftovers

  // Convert raw chunks to AssistantChunk objects
  const assistantChunks: AssistantChunk[] = [];
  let currentMarkdown = '';

  for (const chunk of chunks) {
    if (typeof chunk === 'string') {
      currentMarkdown += chunk;
    } else {
      if (currentMarkdown) {
        assistantChunks.push({
          type: 'text',
          content: currentMarkdown,
        });
        currentMarkdown = '';
      }
      // Assuming the workflow step should be converted to JSON content
      assistantChunks.push({
        type: 'json',
        content: JSON.stringify(chunk),
      });
    }
  }

  if (currentMarkdown) {
    assistantChunks.push({
      type: 'text',
      content: currentMarkdown,
    });
  }

  return assistantChunks.filter(Boolean);
}
