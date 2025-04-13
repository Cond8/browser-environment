import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import { DslEditor } from './dsl-editor';
import { JsEditor } from './js-editor';
import { JsonEditor } from './json-editor';

type EditorType = 'json' | 'js' | 'dsl';

export const EditorWrapper = () => {
  const [editorType, setEditorType] = useState<EditorType>('json');

  const renderEditor = () => {
    switch (editorType) {
      case 'dsl':
        return <DslEditor dslContent={''} />;
      case 'json':
        return <JsonEditor jsonContent={''} />;
      case 'js':
        return <JsEditor jsContent={''} />;
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
