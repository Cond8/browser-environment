import { Card } from '@/components/ui/card';
import { AssistantPanel } from '@/features/chat';
import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export const EditorLayout: React.FC = () => {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Left Panel - File Explorer */}
      <Panel defaultSize={50} minSize={30}>
        <Card className="h-full rounded-none border-r pt-0 bg-background">
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-2">File Explorer</h2>
            <div className="text-sm text-muted-foreground">File explorer content will go here</div>
          </div>
        </Card>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

      {/* Right Panel - Chat */}
      <Panel defaultSize={50} minSize={30}>
        <Card className="h-full rounded-none pt-0 bg-background">
          <div className="h-full">
            <AssistantPanel />
          </div>
        </Card>
      </Panel>
    </PanelGroup>
  );
};
