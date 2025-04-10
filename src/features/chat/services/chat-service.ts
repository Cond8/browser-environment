import { allTools } from '../tools';
import { ollama, OllamaChatResponse, OllamaMessage } from './ollama-sdk';
import { SYSTEM_PROMPT } from './system-prompt';
import { handleToolResponse } from './tool-handler';

// Send a message to the chat and process the response
export const sendMessage = async (
  content: string,
  conversationId: string,
  options: {
    useTools?: boolean;
    systemPrompt?: string;
    temperature?: number;
    streaming?: boolean;
    onToken?: (token: string) => void;
  } = {},
): Promise<OllamaChatResponse | void> => {
  const {
    useTools = true,
    systemPrompt = SYSTEM_PROMPT,
    temperature = 0.5,
    streaming = false,
    onToken,
  } = options;

  const { addMessage, setLoading } = useChatStore.getState();

  // Add user message to store
  addMessage({
    role: 'user',
    content,
  });

  // Build message history from the current conversation
  const { conversations } = useChatStore.getState();
  const conversation = conversations[conversationId];

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  // Create messages array for Ollama
  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversation.messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
      })),
  ];

  // Set loading state
  setLoading(true);

  try {
    if (streaming && onToken) {
      // If streaming, collect tokens and build response
      let responseContent = '';
      let finalResponse: OllamaChatResponse | null = null;

      await ollama.chatStream(
        {
          model: ollama.getDefaultModel(),
          messages,
          stream: true,
          tools: useTools ? allTools : undefined,
          options: {
            temperature,
          },
        },
        chunk => {
          responseContent += chunk.message.content;
          onToken(chunk.message.content);

          if (chunk.done) {
            finalResponse = {
              ...chunk,
              message: {
                ...chunk.message,
                content: responseContent,
              },
            };
          }
        },
      );

      if (finalResponse) {
        // Add final response to store
        addMessage({
          role: 'assistant',
          content: finalResponse.message.content,
          tool_calls: finalResponse.message.tool_calls,
        });

        // Process tool response if available
        if (useTools && finalResponse.message.tool_calls?.length) {
          handleToolResponse(finalResponse, conversationId);
        }

        return finalResponse;
      }
    } else {
      // Non-streaming request
      const response = await ollama.chat({
        model: ollama.getDefaultModel(),
        messages,
        stream: false,
        tools: useTools ? allTools : undefined,
        options: {
          temperature,
        },
      });

      // Add response to store
      addMessage({
        role: 'assistant',
        content: response.message.content,
        tool_calls: response.message.tool_calls,
      });

      // Process tool response if available
      if (useTools && response.message.tool_calls?.length) {
        handleToolResponse(response, conversationId);
      }

      return response;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
