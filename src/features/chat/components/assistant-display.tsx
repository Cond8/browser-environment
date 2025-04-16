import { AssistantMessage } from '../models/assistant-message';

interface AssistantDisplayProps {
  assistantMessage: AssistantMessage;
}

export const AssistantDisplay = ({ assistantMessage }: AssistantDisplayProps) => {
  const { content } = assistantMessage;

  // first get all the content within ```json``` tags
  // there are about 6 of them
  // so we need a for loop to get all of them
  const jsonChunks: (string | any)[] = [];
  content.split('```json').forEach(chunk => {
    if (chunk.includes('```')) {
      const [json, text] = chunk.split('```');
      jsonChunks.push(JSON.parse(json));
      jsonChunks.push(text);
    } else {
      jsonChunks.push(chunk);
    }
  });

  return (
    <div>
      {jsonChunks.map((chunk, index) => {
        if (typeof chunk === 'string') {
          return <div key={index}>{chunk}</div>;
        }
        return <div key={index}>{JSON.stringify(chunk)}</div>;
      })}
    </div>
  );
};
