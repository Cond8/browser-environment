// src/features/editor/components/json-editor.tsx
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

export interface JsonEditorProps {
  jsonContent: WorkflowStep[];
}

export const JsonEditor = ({ jsonContent }: JsonEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    console.log('[JsonEditor] Editor mounted');
    editorRef.current = editor;
    editorRef.current.setValue(JSON.stringify(jsonContent, null, 2));
  };

  useEffect(() => {
    editorRef.current.setValue(JSON.stringify(jsonContent, null, 2));
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
