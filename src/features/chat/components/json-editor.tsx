import { useStreamStore } from '@/features/chat/store/stream-store';
import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

export const JsonEditor = () => {
  console.log('[JsonEditor] Component rendering');
  const currentMessageId = useStreamStore(state => state.currentMessageId);
  const jsonContent = useStreamStore(state =>
    currentMessageId ? state.partialJsons[currentMessageId] : '',
  );

  console.log('[JsonEditor] Current message ID:', currentMessageId);
  console.log('[JsonEditor] JSON content:', jsonContent);

  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    console.log('[JsonEditor] Editor mounted');
    editorRef.current = editor;
  };

  useEffect(() => {
    console.log('[JsonEditor] useEffect triggered with content:', jsonContent);
    if (editorRef.current && typeof jsonContent === 'string') {
      console.log('[JsonEditor] Setting editor value');
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
