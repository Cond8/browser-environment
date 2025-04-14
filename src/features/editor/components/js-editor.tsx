// src/features/editor/components/js-editor.tsx
import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import { jsonToJs } from '../transpilers/json-to-js';
import { dslToJson } from '../transpilers/dsl-to-json';
import { WorkflowStep } from '@/features/ollama-api/streaming/api/workflow-step';

export interface JsEditorProps {
  jsonContent: WorkflowStep[];
}

export const JsEditor = ({ jsonContent }: JsEditorProps) => {
  const [jsContent, setJsContent] = useState<string>(jsonToJs(jsonContent));
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    console.log('[JsEditor] Editor mounted');
    editorRef.current = editor;
    editorRef.current.setValue(jsContent);
  };

  useEffect(() => {
    const js = jsonToJs(dslToJson(dslContent))
    setJsContent(js)
    editorRef.current.setValue(js)
  }, [dslContent]);

  useEffect(() => {
    if (editorRef.current && typeof jsContent === 'string') {
      editorRef.current.setValue(jsContent);
    }
  }, [jsContent]);

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
