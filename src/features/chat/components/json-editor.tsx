import { useStreamStore } from '@/features/chat/store/stream-store';
import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

export const JsonEditor = () => {
  const currentMessageId = useStreamStore(state => state.currentMessageId);
  const jsonContent = useStreamStore(state =>
    currentMessageId ? state.partialJsons[currentMessageId] : '',
  );

  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
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
