// src/features/editor/components/dsl-editor.tsx
import Editor from '@monaco-editor/react';
import { editor, languages } from 'monaco-editor';
import { useEffect, useRef } from 'react';

export interface DslEditorProps {
  dslContent: string;
}

// JSDoc-based DSL custom tokenizer (for highlighting only parseable tags)
const jsdocDslTokenizer: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.jsdoc-dsl',
  name: 'jsdoc-dsl',

  tokenizer: {
    root: [
      [/\/\*\*/, 'comment.doc', '@jsdoc'],
      [/\/\/.*/, 'comment'],
      [/[^/]+/, ''],
    ],

    jsdoc: [
      [/\*\s*/, 'comment.doc'],
      [/@(?:name|module|function|param|returns)/, 'comment.doc.tag'],
      [/\{[^}]+\}/, 'comment.doc.type'],
      [/\*\//, 'comment.doc', '@pop'],
      [/\*[^/]/, 'comment.doc'],
      [/[^*]+/, 'comment.doc'],
    ],
  },
};

// Custom theme for validated JSDoc DSL
const jsdocDslTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment.doc', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'comment.doc.tag', foreground: '569CD6', fontStyle: 'bold' },
    { token: 'comment.doc.type', foreground: 'C586C0' },
    { token: 'comment.doc.name', foreground: 'DCDCAA' },
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editor.lineHighlightBackground': '#2D2D2D',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#3A3D41',
    'editor.lineHighlightBorder': '#2D2D2D',
  },
};

export const DslEditor = ({ dslContent }: DslEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    console.log('[DslEditor] Editor mounted');
    editorRef.current = editor;
    editorRef.current.setValue(dslContent);
  };

  useEffect(() => {
    if (editorRef.current && typeof dslContent === 'string') {
      editorRef.current.setValue(dslContent);
    }
  }, [dslContent]);

  return (
    <Editor
      height="100%"
      defaultLanguage="jsdoc-dsl"
      theme="jsdoc-dsl-theme"
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
      }}
      onMount={handleEditorDidMount}
      beforeMount={monaco => {
        monaco.languages.register({
          id: 'jsdoc-dsl',
        });
        monaco.languages.setMonarchTokensProvider('jsdoc-dsl', jsdocDslTokenizer);
        monaco.editor.defineTheme('jsdoc-dsl-theme', jsdocDslTheme);
      }}
    />
  );
};
