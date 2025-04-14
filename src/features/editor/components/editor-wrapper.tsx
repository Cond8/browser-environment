// src/features/editor/components/editor-wrapper.tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import { useEditorStore } from '../stores/editor-store';
import { DslEditor } from './dsl-editor';
import { JsEditor } from './js-editor';
import { JsonEditor } from './json-editor';

type EditorType = 'json' | 'js' | 'dsl';

export const EditorWrapper = () => {
  const [editorType, setEditorType] = useState<EditorType>('json');
  const jsonContent = useEditorStore(state => state.content);

  const renderEditor = () => {
    switch (editorType) {
      case 'dsl':
        console.log('[EditorWrapper] DSL content:', jsonContent);
        return <DslEditor jsonContent={jsonContent} />;
      case 'json':
        return <JsonEditor jsonContent={jsonContent} />;
      case 'js':
        return <JsEditor jsonContent={jsonContent} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b w-full">
        <ToggleGroup
          type="single"
          value={editorType}
          onValueChange={value => setEditorType(value as EditorType)}
          className="w-full"
        >
          <ToggleGroupItem value="dsl" className="flex-1">
            DSL
          </ToggleGroupItem>
          <ToggleGroupItem value="json" className="flex-1">
            JSON
          </ToggleGroupItem>
          <ToggleGroupItem value="js" className="flex-1">
            JavaScript
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex-1">{renderEditor()}</div>
    </div>
  );
};
