import { OllamaConnectionService } from '@/features/chat/services/ollama-connection-service';
import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const ollamaService = new OllamaConnectionService();

  const stream = await ollamaService.sendMessageStream(
    messages.map((msg: any) => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      content:
        typeof msg.content === 'string'
          ? msg.content
          : msg.content.map((part: any) => part.text).join(''),
    })),
    chunk => {
      return chunk.message.content;
    },
    error => {
      console.error('Error in Ollama stream:', error);
      throw error;
    },
  );

  return new StreamingTextResponse(stream);
}
