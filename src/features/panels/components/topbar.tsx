// src/features/panels/components/topbar.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SettingsDialog } from '@/features/settings/components/settings-dialog';
import { Settings } from 'lucide-react';
import React, { useState } from 'react';

export const TopBar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="rounded-none border-b bg-background">
      <div className="h-4 flex items-center justify-between px-4">
        <h1 className="text-lg font-semibold tracking-tight">Cond8 Webview</h1>

        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Settings className="h-5 w-5" />
          <span className="sr-only">Open settings</span>
        </Button>
        <SettingsDialog open={open} onOpenChange={setOpen} />
      </div>
    </Card>
  );
};
