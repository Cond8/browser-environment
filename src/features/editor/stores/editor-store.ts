// src/features/editor/stores/editor-store.ts
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface EditorState {
  // File content and path
  content: WorkflowStep[];
  filePath: string | null;
  isLocalOnly: boolean;

  // Actions
  setContent: (content: WorkflowStep[]) => void;
  setFilePath: (filepath: string | null) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    immer(set => ({
      // Initial state
      content: [],
      filePath: null,
      isLocalOnly: true,

      // Actions
      setContent: content => {
        set(state => {
          state.content = content;
        });
      },
      setFilePath: (filepath: string | null) => {
        set(state => {
          if (filepath === null) {
            state.filePath = null;
            state.isLocalOnly = true;
          } else {
            state.filePath = filepath;
            state.isLocalOnly = false;
            state.content = [];
          }
        });
      },
    })),
    {
      name: 'editor-storage',
    },
  ),
);

// Helper function to check if content is saved
export const isContentSaved = (): boolean => {
  return !useEditorStore.getState().isLocalOnly;
};
