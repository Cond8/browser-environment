// src/features/chat/services/chat-service.ts
import { OllamaMessage, OllamaStreamResponse, OllamaTool } from '@/lib/ollama';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { Message, useChatStore } from '../store/chat-store';
import { useOllamaStore } from '../store/ollama-store';

export class ChatService {
  private static instance: ChatService;
  private isStreaming = false;

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public async sendMessage(message: string, tools: OllamaTool[] = []): Promise<void> {
    const chatStore = useChatStore.getState();
    const ollamaStore = useOllamaStore.getState();
    const configStore = useAssistantConfigStore.getState();

    if (!chatStore.currentThreadId) {
      chatStore.createThread();
    }

    // Add user message
    chatStore.addMessage({
      role: 'user',
      content: message,
    });

    // Get all messages from the current thread
    const thread = chatStore.threads.find(t => t.id === chatStore.currentThreadId);
    if (!thread) return;

    // Convert chat store messages to Ollama format
    const ollamaMessages = this.convertToOllamaMessages(thread.messages);

    this.isStreaming = true;
    chatStore.setIsStreaming(true);

    try {
      // Configure model options from assistant config
      const options = this.getModelOptions(configStore.parameters);

      // Get selected model or use default
      const model = configStore.selectedModel || ollamaStore.ollamaService.config.defaultModel;

      // Setup content accumulator for the assistant's response
      let accumulatedContent = '';

      // Send the request using the Ollama service
      await ollamaStore.ollamaService.chatWithTools(
        {
          model,
          messages: ollamaMessages,
          tools,
          options,
        },
        (response: OllamaStreamResponse) => {
          if (this.isStreaming) {
            const content = response.message.content || '';

            // If this is the first message, add it to the thread
            if (!accumulatedContent) {
              chatStore.addMessage({
                role: 'assistant',
                content,
              });
            } else {
              // Update the existing message with accumulated content
              chatStore.updateLastMessage(accumulatedContent + content);
            }

            accumulatedContent += content;
          }
        },
      );
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message to the thread
      chatStore.addMessage({
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      this.isStreaming = false;
      chatStore.setIsStreaming(false);
    }
  }

  public stopStreaming(): void {
    this.isStreaming = false;
    useChatStore.getState().setIsStreaming(false);
  }

  private convertToOllamaMessages(messages: Message[]): OllamaMessage[] {
    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  private getModelOptions(parameters: any) {
    return {
      temperature: parameters.temperature,
      top_p: parameters.topP,
      top_k: parameters.topK,
      num_predict: parameters.numPredict,
      repeat_penalty: parameters.repeatPenalty,
      repeat_last_n: parameters.repeatLastN,
      tfs_z: parameters.tfsZ,
      mirostat: parameters.mirostat,
      mirostat_eta: parameters.mirostatEta,
      mirostat_tau: parameters.mirostatTau,
      num_ctx: parameters.numCtx,
    };
  }
}
