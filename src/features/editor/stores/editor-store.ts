// src/features/editor/stores/editor-store.ts
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';
import { useWorkflowStore } from '@/features/vfs/store/workflow-store';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface EditorState {
  // File content and path
  content: WorkflowStep[];

  // Actions
  setContent: (content: WorkflowStep[]) => void;
  setFilePath: (filepath: string) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    immer(set => ({
      // Initial state
      content: [],

      // Actions
      setContent: content => {
        set(state => {
          state.content = content;
        });
      },
      setFilePath: (filepath: string) => {
        set(state => {
          state.content = useWorkflowStore.getState().getWorkflow(filepath)?.content ?? [];
        });
      },
    })),
    {
      name: 'editor-storage',
    },
  ),
);
