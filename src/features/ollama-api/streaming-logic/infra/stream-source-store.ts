// src/features/ollama-api/streaming-logic/infra/stream-source-store.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
import { useChatStore } from '@/features/chat/store/chat-store';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { executeWorkflowChain } from '../api/workflow-chain';

export interface StreamSourceState {
  isStreaming: boolean;
  setIsStreaming: (isLoading: boolean) => void;
  message: string;
  startWorkflowChain: () => Promise<AssistantMessage>;
}

export const useStreamSourceStore = create<StreamSourceState>()(
  immer(set => ({
    isStreaming: false,
    message: '',
    setIsStreaming: (isLoading: boolean) => set({ isStreaming: isLoading }),

    startWorkflowChain: async () => {
      set({ isStreaming: true, message: '' });
      console.log('startWorkflowChain');

      let finalAssistantMessage: AssistantMessage | undefined = undefined;
      let rawSlmBuffer = '';

      try {
        const generator = executeWorkflowChain();

        while (true) {
          const { value, done } = await generator.next();
          if (done) {
            // At the end, create a final message from the accumulated buffer
            finalAssistantMessage = new AssistantMessage();
            finalAssistantMessage.rawChunks = [rawSlmBuffer];
            break;
          }

          // Accumulate the raw SLM
          rawSlmBuffer += value;

          // Update UI state
          set(state => {
            state.message += value;
          });
        }

        // First set streaming to false
        set(state => {
          state.isStreaming = false;
        });

        // Then add the final message to the chat store
        if (finalAssistantMessage) {
          useChatStore.getState().addAssistantMessage(finalAssistantMessage);
        }

        return finalAssistantMessage;
      } catch (error: any) {
        console.error('Error in workflow chain:', error.message);
        set(state => {
          state.isStreaming = false;
        });
        throw error;
      }
    },
  })),
);
