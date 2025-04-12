// src/features/panels/components/editor-layout.tsx
import { Card } from '@/components/ui/card';
import { AssistantPanel } from '@/features/chat';
import { YamlEditor } from '@/features/chat/components/yaml-editor';
import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export const EditorLayout: React.FC = () => {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Left Panel - File Explorer */}
      <Panel defaultSize={50} minSize={30}>
        <Card className="h-full rounded-none border-r py-0 bg-background">
          <YamlEditor />
        </Card>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

      {/* Right Panel - Chat */}
      <Panel defaultSize={50} minSize={30}>
        <Card className="h-full rounded-none py-0 bg-background">
          <div className="h-full">
            <AssistantPanel />
          </div>
        </Card>
      </Panel>
    </PanelGroup>
  );
};
