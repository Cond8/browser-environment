import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

export interface JsEditorProps {
  jsContent: string;
}

export const JsEditor = ({ jsContent }: JsEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    console.log('[JsEditor] Editor mounted');
    editorRef.current = editor;
  };

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
