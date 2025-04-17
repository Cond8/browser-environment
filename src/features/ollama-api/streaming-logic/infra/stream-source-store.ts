// src/features/ollama-api/streaming-logic/infra/stream-source-store.ts
import { AssistantMessage } from '@/features/chat/models/assistant-message';
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
      set({ isStreaming: true });
      console.log('startWorkflowChain');

      let finalAssistantMessage: AssistantMessage | undefined = undefined;

      try {
        const generator = executeWorkflowChain();

        while (true) {
          const { value, done } = await generator.next();
          if (done) {
            finalAssistantMessage = value; // This is the return value of the async generator
            break;
          }
          set(state => {
            state.message += value;
          });
        }

        set(state => {
          state.isStreaming = false;
        });

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
