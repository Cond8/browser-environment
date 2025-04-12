// src/features/chat/components/yaml-editor.tsx
import { useStreamStore } from '@/features/chat/store/stream-store';
import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

export const YamlEditor = () => {
  const yamlContent = useStreamStore(state => state.partialYaml);

  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (editorRef.current && typeof yamlContent === 'string') {
      editorRef.current.setValue(yamlContent);
    }
  }, [yamlContent]);

  return (
    <Editor
      height="100%"
      defaultLanguage="yaml"
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
