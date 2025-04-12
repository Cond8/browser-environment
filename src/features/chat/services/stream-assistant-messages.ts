export type StreamYield =
  | { type: 'text'; content: string }
  | { type: 'start_yaml' }
  | { type: 'end_yaml' };

export async function* streamAssistantMessages(
  response: Response,
): AsyncGenerator<StreamYield, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is null');

  const decoder = new TextDecoder();

  let lookbehindBuffer = '';
  let insideYaml = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const content = parsed.message?.content;
        if (!content) continue;

        lookbehindBuffer += content;
        const normalizedBuffer = lookbehindBuffer.toLowerCase();

        if (insideYaml && normalizedBuffer.includes('`')) {
          lookbehindBuffer = '';
          insideYaml = false;
          yield { type: 'end_yaml' };
        }

        yield { type: 'text', content };

        if (!insideYaml && normalizedBuffer.includes('```yaml')) {
          lookbehindBuffer = '';
          insideYaml = true;
          yield { type: 'start_yaml' };
        }

        // 🧼 Trim buffer to avoid unbounded growth
        if (lookbehindBuffer.length > 1000) {
          lookbehindBuffer = lookbehindBuffer.slice(-500);
        }
      } catch (err) {
        console.error('Error parsing chunk:', err);
      }
    }
  }
}
