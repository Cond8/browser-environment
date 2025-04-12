import InterfaceDetails from './json-interface-details';
import { JsonViewer } from './json-viewer';

type JsonParserProps = {
  content: string;
};

// Extract JSON from fenced blocks if available.
const extractJsonContent = (content: string): string => {
  const jsonFenceRegex = /```(?:json)?\n([\s\S]*?)```/;
  const match = content.match(jsonFenceRegex);
  return match ? match[1].trim() : content.trim();
};

export const JsonParser = ({ content }: JsonParserProps) => {
  let parsed: any;
  let error: string | null = null;
  const jsonContent = extractJsonContent(content);

  try {
    parsed = JSON.parse(jsonContent);
  } catch (e) {
    error = (e as Error).message;
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
        <JsonViewer content={JSON.stringify(parsed, null, 2)} error={error} />
      )}
    </div>
  );
};
