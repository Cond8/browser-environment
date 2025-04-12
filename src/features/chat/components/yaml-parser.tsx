import YAML from 'yaml';
import InterfaceDetails from './yaml-interface-details';
import { YamlViewer } from './yaml-viewer';

type YamlParserProps = {
  content: string;
};

const extractYamlFromFences = (content: string): string => {
  const yamlFenceRegex = /```(?:yaml)?\n([\s\S]*?)```/g;
  const matches = [...content.matchAll(yamlFenceRegex)];

  if (matches.length === 0) {
    return content.trim();
  }

  // If we have multiple YAML blocks, try to merge them
  if (matches.length > 1) {
    const parsedBlocks = matches.map(match => YAML.parse(match[1].trim()));
    const merged = parsedBlocks.reduce((acc, block) => ({ ...acc, ...block }), {});
    return YAML.stringify(merged);
  }

  return matches[0][1].trim();
};

export const YamlParser = ({ content }: YamlParserProps) => {
  let parsed: any;
  let error: string | null = null;

  try {
    const yamlContent = extractYamlFromFences(content);
    parsed = YAML.parse(yamlContent);
  } catch (e) {
    error = (e as Error).message;
  }

  console.log({ parsed, error });

  // If parsing failed or the result is not an object, show the original content
  if (error || typeof parsed !== 'object' || parsed === null) {
    return <p className="whitespace-pre-wrap p-4">{content}</p>;
  }

  return (
    <div className="p-4 bg-muted/30">
      {'interface' in parsed || 'steps' in parsed ? (
        <InterfaceDetails data={parsed} />
      ) : (
        <YamlViewer content={YAML.stringify(parsed)} error={error} />
      )}
    </div>
  );
};
