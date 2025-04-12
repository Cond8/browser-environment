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

// Check if content looks like it might be JSON
const looksLikeJson = (content: string): boolean => {
  const trimmed = content.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    content.includes('```json')
  );
};

export const JsonParser = ({ content }: JsonParserProps) => {
  // If content doesn't look like JSON, just display it as regular text
  if (!looksLikeJson(content)) {
    return (
      <div className="p-4 bg-muted/30">
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    );
  }

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
        <JsonViewer content={content} error={error} />
      )}
    </div>
  );
};
