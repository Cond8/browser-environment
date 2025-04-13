import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useEffect, useRef } from 'react';

export interface DslEditorProps {
  dslContent: string;
}

// Custom DSL theme
const dslTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark' as editor.BuiltinTheme,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '569CD6' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'comment', foreground: '6A9955' },
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
  },
};

export const DslEditor = ({ dslContent }: DslEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    console.log('[DslEditor] Editor mounted');
    editorRef.current = editor;
  };

  useEffect(() => {
    if (editorRef.current && typeof dslContent === 'string') {
      editorRef.current.setValue(dslContent);
    }
  }, [dslContent]);

  return (
    <Editor
      height="100%"
      defaultLanguage="plaintext"
      theme="dsl-theme"
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
      }}
      onMount={handleEditorDidMount}
      beforeMount={monaco => {
        monaco.editor.defineTheme('dsl-theme', dslTheme);
      }}
    />
  );
};
