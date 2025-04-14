// src/features/editor/components/dsl-editor.tsx
import Editor from '@monaco-editor/react';
import { editor, languages } from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';
import { jsonToDsl } from '../transpilers/json-to-dsl';

export interface DslEditorProps {
  jsonContent: string;
}

// DSL Language Configuration
const dslLanguageConfig: languages.ILanguageExtensionPoint = {
  id: 'cond8-dsl',
  extensions: ['.dsl'],
  aliases: ['cond8-dsl', 'dsl'],
};

// DSL Tokenization Rules
const dslTokenProvider: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.dsl',

  // Define keyword categories
  interfaceKeywords: ['INTERFACE', 'SERVICE', 'METHOD', 'GOAL', 'PARAMS', 'RETURNS'],
  serviceKeywords: [
    'EXTRACT',
    'PARSE',
    'VALIDATE',
    'TRANSFORM',
    'LOGIC',
    'CALCULATE',
    'FORMAT',
    'IO',
    'STORAGE',
    'INTEGRATE',
    'UNDERSTAND',
    'GENERATE',
  ],

  tokenizer: {
    root: [
      // Individual interface keywords
      [/(INTERFACE)\b/, 'INTERFACE'],
      [/(SERVICE)\b/, 'SERVICE'],
      [/(METHOD)\b/, 'METHOD'],
      [/(GOAL)\b/, 'GOAL'],
      [/(PARAMS)\b/, 'PARAMS'],
      [/(RETURNS)\b/, 'RETURNS'],

      // Service keywords
      [
        /(EXTRACT|PARSE|VALIDATE|TRANSFORM|LOGIC|CALCULATE|FORMAT|IO|STORAGE|INTEGRATE|UNDERSTAND|GENERATE)\b/,
        { cases: { '@serviceKeywords': 'keyword.service' } },
      ],

      // PascalCase names (for interface and step names)
      [/[A-Z][a-zA-Z0-9]*/, 'identifier'],

      // snake_case identifiers (for methods, params, returns)
      [/[a-z][a-z0-9]*(_[a-z0-9]+)*/, 'parameter'],

      // Comma-separated lists (for params and returns)
      [/([a-z][a-z0-9]*(_[a-z0-9]+)*)(\s*,\s*[a-z][a-z0-9]*(_[a-z0-9]+)*)*/, 'parameter'],

      // Strings (for goals and descriptions)
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
      [/'([^'\\]|\\.)*$/, 'string.invalid'], // non-terminated string
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],

      // Braces and brackets
      [/[{}]/, 'delimiter.curly'],
      [/[\[\]]/, 'delimiter.square'],

      // Whitespace
      { include: '@whitespace' },
    ],

    whitespace: [
      [/\s+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/"/, 'string', '@pop'],
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/'/, 'string', '@pop'],
    ],
  },
};

// Custom DSL theme
const dslTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark' as editor.BuiltinTheme,
  inherit: true,
  rules: [
    // Individual keyword colors
    { token: 'INTERFACE', foreground: 'FF6B6B', fontStyle: 'bold underline' },
    { token: 'SERVICE', foreground: '4EC9B0', fontStyle: 'bold underline' },
    { token: 'METHOD', foreground: 'C586C0', fontStyle: 'bold' },
    { token: 'GOAL', foreground: 'DCDCAA', fontStyle: 'bold' },
    { token: 'PARAMS', foreground: '9CDCFE', fontStyle: 'bold' },
    { token: 'RETURNS', foreground: '569CD6', fontStyle: 'bold underline' },

    // Other tokens
    { token: 'string', foreground: 'CE9178' },
    { token: 'identifier', foreground: '9CDCFE' },
    { token: 'parameter', foreground: '9CDCFE' },
    { token: 'comment', foreground: '6A9955' },
    { token: 'delimiter.curly', foreground: 'D4D4D4' },
    { token: 'delimiter.square', foreground: 'D4D4D4' },
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

export const DslEditor = ({ jsonContent }: DslEditorProps) => {
  const [dslContent, setDslContent] = useState<string>(jsonToDsl(jsonContent));
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    console.log('[DslEditor] Editor mounted');
    editorRef.current = editor;
    editorRef.current.setValue(dslContent);
  };

  useEffect(() => {
    const dsl = jsonToDsl(jsonContent);
    console.log('[DslEditir] JSON content:', jsonContent);
    setDslContent(dsl);
    console.log('[DslEditor] Editor content:', dsl);
  }, [jsonContent]);

  useEffect(() => {
    if (editorRef.current && typeof dslContent === 'string') {
      editorRef.current.setValue(dslContent);
    }
  }, [dslContent]);

  return (
    <Editor
      height="100%"
      defaultLanguage="cond8-dsl"
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
        monaco.languages.register(dslLanguageConfig);
        monaco.languages.setMonarchTokensProvider('cond8-dsl', dslTokenProvider);
      }}
    />
  );
};
