// src/features/editor/components/js-editor.tsx
import { WorkflowStep } from '@/features/ollama-api/streaming-logic/phases/types';
import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import { jsonToJs } from '../transpilers-dsl-source/json-to-js';

export interface JsEditorProps {
  jsonContent: WorkflowStep[];
}

export const JsEditor = ({ jsonContent }: JsEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    console.log('[JsEditor] Editor mounted');
    editorRef.current = editor;
    editorRef.current.setValue(jsonToJs(jsonContent));
  };

  useEffect(() => {
    editorRef.current.setValue(jsonToJs(jsonContent));
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
