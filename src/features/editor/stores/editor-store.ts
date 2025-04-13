import { useServiceStore } from '@/features/vfs/store/service-store';
import { useWorkflowStore } from '@/features/vfs/store/workflow-store';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface EditorState {
  // File content and path
  content: string;
  filePath: string | null;

  // Selection and cursor state
  selection: {
    start: number;
    end: number;
  } | null;
  cursorPosition: {
    line: number;
    column: number;
  } | null;

  // Editor settings
  settings: {
    fontSize: number;
    theme: 'light' | 'dark';
    wordWrap: boolean;
    lineNumbers: boolean;
  };

  // Actions
  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  setSelection: (selection: { start: number; end: number } | null) => void;
  setCursorPosition: (position: { line: number; column: number } | null) => void;
  updateSettings: (settings: Partial<EditorState['settings']>) => void;

  setActiveEditor: (fileType: 'workflow' | 'service', filepath: string) => void;
}

export const useEditorStore = create<EditorState>()(
  immer(set => ({
    // Initial state
    content: '',
    filePath: null,
    selection: null,
    cursorPosition: null,
    settings: {
      fontSize: 14,
      theme: 'dark',
      wordWrap: true,
      lineNumbers: true,
    },

    // Actions
    setContent: content => {
      set(state => {
        state.content = content;
      });
    },
    setFilePath: filePath => {
      set(state => {
        state.filePath = filePath;
      });
    },
    setSelection: selection => {
      set(state => {
        state.selection = selection;
      });
    },
    setCursorPosition: cursorPosition => {
      set(state => {
        state.cursorPosition = cursorPosition;
      });
    },
    updateSettings: newSettings => {
      set(state => {
        Object.assign(state.settings, newSettings);
      });
    },
    setActiveEditor: (fileType: 'workflow' | 'service', filepath: string) => {
      set(state => {
        state.filePath = filepath;
        if (fileType === 'workflow') {
          state.content = JSON.stringify(
            useWorkflowStore.getState().getWorkflow(filepath)?.content ?? {},
          );
        } else if (fileType === 'service') {
          state.content = useServiceStore.getState().getService(filepath)?.content ?? '';
        }
      });
    },
  })),
);
