// src/features/editor/components/js-editor.tsx
import type { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useEffect, useRef } from 'react';
import { jsonToJs } from '../transpilers-dsl-source/json-to-js';

export interface JsEditorProps {
  jsonContent: WorkflowStep[];
}

export const JsEditor = ({ jsonContent }: JsEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    console.log('[JsEditor] Editor mounted');
    editorRef.current = editor;
    editorRef.current.setValue(jsonToJs(jsonContent));
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(jsonToJs(jsonContent));
    }
  }, [jsonContent]);

  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
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
