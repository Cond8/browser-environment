import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Card } from '@/components/ui/card';

export const EditorLayout: React.FC = () => {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Left Panel - File Explorer */}
      <Panel defaultSize={20} minSize={15}>
        <Card className="h-full rounded-none border-r">
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-2">File Explorer</h2>
            <div className="text-sm text-muted-foreground">File explorer content will go here</div>
          </div>
        </Card>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

      {/* Middle Panel - Editor */}
      <Panel defaultSize={60} minSize={40}>
        <Card className="h-full rounded-none">
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-2">Editor</h2>
            <div className="text-sm text-muted-foreground">Editor content will go here</div>
          </div>
        </Card>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

      {/* Right Panel - Properties/Console */}
      <Panel defaultSize={20} minSize={15}>
        <Card className="h-full rounded-none border-l">
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-2">Properties</h2>
            <div className="text-sm text-muted-foreground">Properties content will go here</div>
          </div>
        </Card>
      </Panel>
    </PanelGroup>
  );
}; 