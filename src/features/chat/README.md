# Chat Feature

This directory contains the implementation for the AI Assistant chat interface. It allows users to interact with an AI model (powered by Ollama), manage conversation threads, and utilize custom tools defined for the assistant.

## Overview

The chat feature provides a user interface for conversing with an AI assistant. It handles:

- Managing multiple chat threads.
- Sending user messages to the Ollama backend.
- Receiving and displaying streamed responses from the assistant.
- Handling tool calls initiated by the assistant.
- Persisting chat history and configuration using Zustand stores.
- Configuring the Ollama connection and model parameters.

## Architecture

The feature is structured into several key areas:

- **`components/`**: Contains React components responsible for rendering the chat UI (e.g., `ChatTopBar`, `ChatContent`, `UserInput`, `RecentThreads`).
- **`store/`**: Houses Zustand stores for managing the application state:
  - `chat-store.ts`: Manages chat threads, messages, current thread, and streaming state.
  - `ollama-store.ts`: Manages the connection to the Ollama service (URL, available models, connection status).
  - `assistant-config-store.ts`: Manages configuration for the AI model (selected model, parameters like temperature, top_p, etc.).
  - `system-prompt.ts`: Defines the core instructions given to the AI assistant.
- **`services/`**: Provides integration with the Ollama backend:
  - `ollama.ts`: A client for interacting with the Ollama API (checking connection, listing models, streaming chat responses, handling tool calls).
  - `ollama-types.ts`: TypeScript types for Ollama API requests and responses.
  - `zod-to-ollama-tool.ts`: Utility to convert Zod schemas into the format required for Ollama tool definitions.
- **`lib/`**: Contains the core logic for orchestrating the chat flow:
  - `chat-orchestrator.ts`: Handles sending user messages and tool responses, creating threads if necessary, and initiating the assistant response stream.
  - `stream-runner.ts`: Manages the streaming connection to Ollama for assistant responses, including handling tool calls within the stream.
  - `tool-executor.ts`: Handles the execution logic when the assistant decides to use a tool, including validating arguments and sending results back.
- **`tools/`**: Defines the tools available to the AI assistant:
  - `problem-solver.ts`: Defines a structured approach for the AI to solve problems using interfaces and steps, along with domain classifications.
  - `domain-tool-generator.ts`: Defines a tool that allows the AI to _generate_ new tools based on a specification.
  - `index.ts`: Exports all available tools.
- **`index.tsx`**: The main entry point component (`AssistantPanel`) that assembles the different UI parts.

## Workflow

1.  **User Input**: The user types a message in the `UserInput` component.
2.  **Send Message**: The `sendUserMessage` function in `chat-orchestrator.ts` is called.
3.  **Thread Management**: A new thread is created via `chat-store` if one doesn't exist, or the message is added to the current thread.
4.  **Initiate Stream**: `beginAssistantStream` in `chat-store` adds an empty assistant message placeholder and sets `isStreaming` to true. `runAssistantStream` in `stream-runner.ts` is called.
5.  **Ollama Request**: `stream-runner.ts` prepares the message history (including the system prompt) and sends a request to the Ollama API via `client.chatWithTools` in `ollama.ts`, including the available tools.
6.  **Streaming Response**: The `ollama.ts` client receives streamed chunks from the Ollama API.
7.  **UI Update/Tool Call**:
    - If the chunk contains content, `updateLastMessage` in `chat-store` updates the placeholder assistant message, and the UI re-renders.
    - If the chunk contains a tool call, `handleToolCall` in `tool-executor.ts` is invoked.
      - The tool arguments are parsed and validated using the Zod schema defined for the tool.
      - A 'tool' message containing the _result_ of the tool call (currently adds the validated args, TODO: implement actual execution) is added via `chat-store`.
      - (Mistake in current `tool-executor`: It sends the _arguments_ back as a tool message, then makes _another_ chat call for continuation, instead of executing the tool and sending the _result_ back. This needs correction.)
      - The process potentially repeats if the continuation requires more tool calls.
8.  **Stream End**: When Ollama sends the `done` flag, `setIsStreaming(false)` is called in `chat-store`.

## Configuration

- **Ollama URL**: Configured via the settings UI, managed by `ollama-store.ts`, and persisted. Defaults to `http://localhost:11434`.
- **Model Selection & Parameters**: Configured via the settings UI, managed by `assistant-config-store.ts`, and persisted. Includes temperature, top_p, etc.

## Key Files

- `index.tsx`: Entry point component.
- `chat-store.ts`: Core state management for conversations.
- `ollama-store.ts`: Manages Ollama connection state.
- `ollama.ts`: Ollama API client implementation.
- `stream-runner.ts`: Handles the logic for processing assistant responses and tool calls during streaming.
- `tool-executor.ts`: Handles parsing and preparing tool calls (needs update for actual execution).
- `problem-solver.ts`: Defines the primary tool the assistant uses for structured problem-solving.
- `system-prompt.ts`: Defines the base instructions for the assistant's behavior.
