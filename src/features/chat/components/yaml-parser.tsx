import YAML from 'yaml';
import InterfaceDetails from './yaml-interface-details';
import { YamlViewer } from './yaml-viewer';

type YamlParserProps = {
  content: string;
};

// Extract YAML from fenced blocks if available.
const extractYamlContent = (content: string): string => {
  const yamlFenceRegex = /```(?:yaml)?\n([\s\S]*?)```/;
  const match = content.match(yamlFenceRegex);
  return match ? match[1].trim() : content.trim();
};

// Attempt to auto-fix common indentation errors from LLM-generated YAML.
const autoFixYaml = (content: string): string => {
  const lines = content.split('\n');
  let fixedLines: string[] = [];
  let currentStepIndent: number | null = null;
  let desiredChildIndent: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    const currentIndent = line.search(/\S|$/);

    // Detect a new list item (for example, a "step") if it starts with "- name:"
    if (trimmed.startsWith('- name:')) {
      currentStepIndent = currentIndent;
      desiredChildIndent = currentStepIndent + 2; // Expect child keys indented 2 spaces more.
      fixedLines.push(line);
      continue;
    }

    // If inside a list item, try to ensure that key-value lines are correctly indented.
    if (currentStepIndent !== null && trimmed && line.includes(':')) {
      // If the line is less indented than desired, reindent it.
      if (currentIndent < (desiredChildIndent ?? 0)) {
        line = ' '.repeat(desiredChildIndent ?? 0) + trimmed;
      }
    }

    // If a line is unindented back to the parent's level, we may have left the list item's block.
    if (currentStepIndent !== null && trimmed && currentIndent <= currentStepIndent && !trimmed.startsWith('- ')) {
      currentStepIndent = null;
      desiredChildIndent = null;
    }

    fixedLines.push(line);
  }

  return fixedLines.join('\n');
};

export const YamlParser = ({ content }: YamlParserProps) => {
  let parsed: any;
  let error: string | null = null;
  const yamlContent = extractYamlContent(content);

  // First, try parsing the original content.
  try {
    parsed = YAML.parse(yamlContent);
  } catch (e) {
    // If parsing fails, try to auto-fix common formatting issues.
    const fixedYaml = autoFixYaml(yamlContent);
    try {
      parsed = YAML.parse(fixedYaml);
    } catch (e2) {
      error = (e2 as Error).message;
    }
  }

  // If parsing still fails or the result is not an object, fall back to rendering the original content.
  if (error || typeof parsed !== 'object' || parsed === null) {
    return <p className="whitespace-pre-wrap p-4">{content}</p>;
  }

  return (
    <div className="p-4 bg-muted/30">
      {('interface' in parsed || 'steps' in parsed) ? (
        <InterfaceDetails data={parsed} />
      ) : (
        <YamlViewer content={YAML.stringify(parsed, { indent: 2 })} error={error} />
      )}
    </div>
  );
};
