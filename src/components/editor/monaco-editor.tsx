import { useRef, useEffect } from 'react';
import Editor, { OnMount, BeforeMount, OnChange } from '@monaco-editor/react';
import { useEditorStore } from '../../lib/store';
import { editor as monacoEditor } from 'monaco-editor';

// Define the Cond8 language
const defineCond8Language = (monaco: typeof import('monaco-editor')) => {
  // Register a new language
  monaco.languages.register({ id: 'cond8' });

  // Define the token provider for syntax highlighting
  monaco.languages.setMonarchTokensProvider('cond8', {
    tokenizer: {
      root: [
        // Keywords
        [/\b(interface|step|goal|input|output|domain|tool)\b/, 'keyword'],
        
        // Strings
        [/"[^"]*"/, 'string'],
        
        // Comments
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        
        // Identifiers
        [/[a-zA-Z][\w$]*/, 'identifier'],
        
        // Brackets
        [/[{}()\[\]]/, '@brackets'],
        
        // Operators
        [/[:;,.]/, 'delimiter'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\/\*/, 'comment', '@push'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment']
      ]
    },
  });

  // Define completion items
  monaco.languages.registerCompletionItemProvider('cond8', {
    provideCompletionItems: (model, position) => {
      const suggestions = [
        {
          label: 'interface',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'interface ${1:name} {\n\tgoal: "${2:description}",\n\tinput: [${3:"input"}],\n\toutput: [${4:"output"}],\n\tdomain: "${5:domain}",\n\ttool: "${6:tool}"\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define a workflow interface',
        },
        {
          label: 'step',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'step ${1:name} {\n\tgoal: "${2:description}",\n\tinput: [${3:"input"}],\n\toutput: [${4:"output"}],\n\tdomain: "${5:domain}",\n\ttool: "${6:tool}"\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define a workflow step',
        },
      ];

      return { suggestions };
    }
  });
};

// Define theme for Cond8
const defineCond8Theme = (monaco: typeof import('monaco-editor')) => {
  monaco.editor.defineTheme('cond8-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'identifier', foreground: '9CDCFE' },
      { token: 'comment', foreground: '6A9955' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorCursor.foreground': '#AEAFAD',
      'editor.lineHighlightBackground': '#2D2D30',
      'editorLineNumber.foreground': '#858585',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
    },
  });
};

interface MonacoEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export const MonacoEditor = ({
  value,
  onChange,
  height = '500px',
  readOnly = false,
}: MonacoEditorProps) => {
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const {
    value: storeValue,
    setValue,
    language,
    theme,
    fontSize,
    showLineNumbers,
    wordWrap,
  } = useEditorStore();

  // Update store value when prop changes
  useEffect(() => {
    if (value !== undefined && value !== storeValue) {
      setValue(value);
    }
  }, [value, storeValue, setValue]);

  const handleBeforeMount: BeforeMount = (monaco) => {
    defineCond8Language(monaco);
    defineCond8Theme(monaco);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Set initial cursor position
    editor.setPosition({ lineNumber: 1, column: 1 });
    
    // Focus the editor
    editor.focus();
  };

  const handleEditorChange: OnChange = (value) => {
    if (value !== undefined) {
      setValue(value);
      onChange?.(value);
    }
  };

  return (
    <Editor
      height={height}
      language={language}
      theme={theme}
      value={storeValue}
      beforeMount={handleBeforeMount}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
      options={{
        fontSize,
        lineNumbers: showLineNumbers ? 'on' : 'off',
        wordWrap: wordWrap ? 'on' : 'off',
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly,
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
}; 