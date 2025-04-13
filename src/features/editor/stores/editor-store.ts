import { useVfsStore } from '@/features/vfs/store/vfs-store';
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

  setActiveEditor: (filepath: string) => void;
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
    setActiveEditor: (filepath) => {
      set(state => {
        state.filePath = filepath;
        state.content = useVfsStore.getState().getContent(filepath);
      });
    },
  })),
);
