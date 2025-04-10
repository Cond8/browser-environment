import { OllamaConnectionService } from '@/features/chat/services/ollama-sdk';
import { CoreMessage, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  if (!conversationId) {
    return new Response('No conversation ID provided', { status: 400 });
  }

  // Create a new ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const ollamaService = new OllamaConnectionService(
          process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          process.env.OLLAMA_MODEL || 'llama2',
        );

        await ollamaService.sendMessageStream(
          messages as CoreMessage[],
          response => {
            // Enqueue the response chunk
            controller.enqueue(new TextEncoder().encode(response.message.content));
          },
          error => {
            controller.error(error);
          },
        );
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new StreamingTextResponse(stream);
}
