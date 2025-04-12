import YAML from 'yaml';
import InterfaceDetails from './yaml-interface-details';
import { YamlViewer } from './yaml-viewer';

type YamlParserProps = {
  content: string;
};

export const YamlParser = ({ content }: YamlParserProps) => {
  const match = content.match(/```ya?ml\n?/i);

  if (!match) {
    return <p className="whitespace-pre-wrap p-4">{content}</p>;
  }

  const startIndex = match.index! + match[0].length;
  const before = content.slice(0, match.index);
  const afterStart = content.slice(startIndex);

  const closingFenceIndex = afterStart.indexOf('```');

  if (closingFenceIndex === -1) {
    return <p className="whitespace-pre-wrap p-4">{content}</p>;
  }

  const yamlContent = afterStart.slice(0, closingFenceIndex);
  const after = afterStart.slice(closingFenceIndex + 3);

  let parsed: any;
  let error: string | null = null;

  try {
    parsed = YAML.parse(yamlContent.trim());
  } catch (e) {
    error = (e as Error).message;
  }

  console.log({ parsed });

  const parts: React.ReactNode[] = [];

  if (before.trim()) {
    parts.push(
      <p key="text-before" className="whitespace-pre-wrap p-4">
        {before}
      </p>,
    );
  }

  parts.push(
    <div key="yaml-part" className="p-4 bg-muted/30">
      {error ? (
        <div className="text-destructive">
          <strong>YAML Parse Error:</strong> {error}
        </div>
      ) : 'interface' in parsed ? (
        <InterfaceDetails data={parsed} />
      ) : (
        <YamlViewer content={YAML.stringify(parsed)} />
      )}
    </div>,
  );

  if (after.trim()) {
    parts.push(
      <p key="text-after" className="whitespace-pre-wrap p-4">
        {after}
      </p>,
    );
  }

  return <>{parts}</>;
};
