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

// Updated auto-fix function: if inside "interface:" then use 2-space indent,
// if inside "steps:" then use 4-space indent.
const autoFixYaml = (content: string): string => {
  const lines = content.split('\n');
  let fixedLines: string[] = [];
  let currentSection: 'interface' | 'steps' | null = null;

  // RegEx to detect a top-level key (starts at column 0) and capture the key name.
  const topLevelKeyRegex = /^(\S+):\s*$/;

  lines.forEach(line => {
    // If the line starts with non-whitespace, it might be a top-level key.
    if (/^\S/.test(line)) {
      const match = line.match(topLevelKeyRegex);
      if (match) {
        const key = match[1];
        // Only recognize sections for which we have explicit indent rules.
        if (key === 'interface' || key === 'steps') {
          currentSection = key as 'interface' | 'steps';
        } else {
          currentSection = null;
        }
      }
      fixedLines.push(line);
      return;
    }

    // For non-top-level lines, determine the desired indentation.
    let desiredIndent = 0;
    if (currentSection === 'interface') {
      desiredIndent = 2;
    } else if (currentSection === 'steps') {
      desiredIndent = 4;
    }
    // Reindent non-empty lines.
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      line = ' '.repeat(desiredIndent) + trimmed;
    }
    fixedLines.push(line);
  });

  return fixedLines.join('\n');
};

export const YamlParser = ({ content }: YamlParserProps) => {
  let parsed: any;
  let error: string | null = null;
  const yamlContent = extractYamlContent(content);

  // Try parsing the original content first.
  try {
    parsed = YAML.parse(yamlContent);
  } catch (e) {
    // Attempt to auto-fix common formatting issues.
    const fixedYaml = autoFixYaml(yamlContent);
    try {
      parsed = YAML.parse(fixedYaml);
    } catch (e2) {
      error = (e2 as Error).message;
    }
  }

  const isValidInterface =
    !error &&
    parsed != null &&
    typeof parsed === 'object' &&
    ('interface' in parsed || 'steps' in parsed);

  return (
    <div className="p-4 bg-muted/30">
      {isValidInterface ? (
        <InterfaceDetails data={parsed} />
      ) : (
        <YamlViewer content={YAML.stringify(parsed, { indent: 2 })} error={error} />
      )}
    </div>
  );
};
