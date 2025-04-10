import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { SettingsDialog } from '@/features/settings/components/settings-dialog';

export const TopBar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="rounded-none border-b">
      <div className="h-12 flex items-center justify-between px-4">
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