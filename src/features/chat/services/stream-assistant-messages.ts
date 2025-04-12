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
  let textBuffer = ''; // Accumulates partial text
  let insideYaml = false; // Indicates if we're inside a YAML code block

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode the chunk and split into lines.
    // (Each line is expected to be a complete JSON message.)
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const content = parsed.message?.content;
        if (!content) continue;

        // Append content to our persistent buffer.
        textBuffer += content;

        // Process the buffer for code fence markers.
        let pos = 0;
        while (true) {
          if (!insideYaml) {
            // Look for a start marker "```yaml"
            const startIndex = textBuffer.indexOf('```yaml', pos);
            if (startIndex === -1) break; // If no marker, wait for more data.
            // Yield any text that comes before the start marker.
            if (startIndex > pos) {
              yield { type: 'text', content: textBuffer.substring(pos, startIndex) };
            }
            // Emit the start marker event.
            yield { type: 'start_yaml' };
            pos = startIndex + '```yaml'.length;
            insideYaml = true;
          } else {
            // Inside a YAML block. Look for the closing marker "```"
            const endIndex = textBuffer.indexOf('```', pos);
            if (endIndex === -1) break; // Wait for the marker to complete.
            // Yield any YAML content before the closing marker.
            if (endIndex > pos) {
              yield { type: 'text', content: textBuffer.substring(pos, endIndex) };
            }
            // Emit the end marker event.
            yield { type: 'end_yaml' };
            pos = endIndex + 3; // 3 characters for "```"
            insideYaml = false;
          }
        }
        // Keep any unprocessed part of the buffer.
        textBuffer = textBuffer.substring(pos);
      } catch (err) {
        console.error('Error parsing chunk:', err);
      }
    }
  }

  // After reading is complete, yield any remaining text.
  if (textBuffer) {
    yield { type: 'text', content: textBuffer };
  }
}
