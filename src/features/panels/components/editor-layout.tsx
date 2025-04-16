// src/features/panels/components/editor-layout.tsx
import { Card } from '@/components/ui/card';
import { AssistantPanel } from '@/features/chat';
import { EditorWrapper } from '@/features/editor/components/editor-wrapper';
import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export const EditorLayout: React.FC = () => {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Left Panel - File System */}
      <Panel defaultSize={20} minSize={15}>
        <Card className="h-full rounded-none border-r py-0 bg-background">Coming soon</Card>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

      {/* Middle Panel - JSON Editor */}
      <Panel defaultSize={40} minSize={30}>
        <Card className="h-full rounded-none border-r py-0 bg-background">
          <EditorWrapper />
        </Card>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

      {/* Right Panel - Chat */}
      <Panel defaultSize={40} minSize={30}>
        <Card className="h-full rounded-none py-0 bg-background">
          <div className="h-full">
            <AssistantPanel />
          </div>
        </Card>
      </Panel>
    </PanelGroup>
  );
};
