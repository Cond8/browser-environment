// src/features/chat/lib/tool-executor.ts
import { OllamaMessage } from '@/features/chat/services/ollama-types.ts';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useChatStore } from '../store/chat-store';
import { useConnStore } from '../store/conn-store';
import { allTools } from '../tools';

interface ToolCall {
  function: {
    name: string;
    arguments: string;
  };
}

export async function handleToolCall(call: ToolCall, messages: OllamaMessage[]) {
  console.log('[ToolExecutor] Starting handleToolCall:', call);
  const { addMessage } = useChatStore.getState();
  const { client } = useConnStore.getState();
  const { selectedModel, parameters } = useAssistantConfigStore.getState();

  const tool = allTools.find(t => t.tool.function.name === call.function.name);
  if (!tool) {
    console.error('[ToolExecutor] No tool found for:', call.function.name);
    throw new Error(`No tool found for: ${call.function.name}`);
  }

  console.log('[ToolExecutor] Found tool:', tool.tool.function.name);

  let parsedArgs;
  try {
    parsedArgs = JSON.parse(call.function.arguments || '{}');
    console.log('[ToolExecutor] Parsed arguments:', parsedArgs);
  } catch (err) {
    console.error('[ToolExecutor] Failed to parse arguments:', err);
    throw new Error(
      `Failed to parse arguments for ${call.function.name}: ${
        err instanceof Error ? err.message : 'Invalid JSON'
      }`,
    );
  }

  const validatedArgs = tool.parser.safeParse(parsedArgs);
  if (!validatedArgs.success) {
    console.error('[ToolExecutor] Validation failed:', validatedArgs.error);
    throw new Error(
      `Invalid arguments for ${call.function.name}: ${JSON.stringify(
        validatedArgs.error.format(),
      )}`,
    );
  }

  console.log('[ToolExecutor] Arguments validated successfully');

  // Add tool call message
  addMessage({
    role: 'tool',
    content: JSON.stringify(validatedArgs.data, null, 2),
    name: call.function.name,
  });

  try {
    console.log('[ToolExecutor] Getting continuation from assistant');
    // Get continuation from assistant
    const continuation = await client.chat({
      model: selectedModel ?? 'default',
      messages: [
        ...messages,
        {
          role: 'tool',
          name: call.function.name,
          content: JSON.stringify(validatedArgs.data),
        },
      ],
      options: parameters,
    });

    console.log('[ToolExecutor] Received continuation:', continuation);

    if ('content' in continuation.message) {
      addMessage({
        role: 'assistant',
        content: continuation.message.content,
      });
      console.log('[ToolExecutor] Added assistant message from continuation');
    }
  } catch (toolError) {
    console.error('[ToolExecutor] Error executing tool:', toolError);
    addMessage({
      role: 'system',
      content: `Error executing tool ${call.function.name}: ${
        toolError instanceof Error ? toolError.message : 'Unknown error'
      }`,
    });
  }
}
