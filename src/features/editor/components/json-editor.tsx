// src/features/editor/components/json-editor.tsx
import type { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useEffect, useRef } from 'react';

export interface JsonEditorProps {
  jsonContent: WorkflowStep[];
}

export const JsonEditor = ({ jsonContent }: JsonEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    console.log('[JsonEditor] Editor mounted');
    editorRef.current = editor;
    editorRef.current.setValue(JSON.stringify(jsonContent, null, 2));
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(JSON.stringify(jsonContent, null, 2));
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
