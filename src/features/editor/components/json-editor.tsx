// src/features/editor/components/json-editor.tsx
import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

export interface JsonEditorProps {
  jsonContent: string;
}

export const JsonEditor = ({ jsonContent }: JsonEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    console.log('[JsonEditor] Editor mounted');
    editorRef.current = editor;
    editorRef.current.setValue(jsonContent);
  };

  useEffect(() => {
    if (editorRef.current && typeof jsonContent === 'string') {
      editorRef.current.setValue(jsonContent);
    }
  }, [jsonContent]);

  return (
    <Editor
      height="100%"
      defaultLanguage="json"
      theme="vs-dark"
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
      }}
      onMount={handleEditorDidMount}
    />
  );
};
