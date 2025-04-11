// src/features/settings/components/settings-dialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Keyboard, Monitor, Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '../store/settings';
import { AssistantSettings } from './assistant-settings';
import { OllamaSettings } from './ollama-settings';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme, showShortcuts, setShowShortcuts } = useSettingsStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Theme</h3>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={value => setTheme(value as 'light' | 'dark' | 'system')}
              className="grid grid-cols-3"
            >
              <ToggleGroupItem value="light" aria-label="Light theme">
                <Sun className="h-4 w-4" />
                <span className="ml-2">Light</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Dark theme">
                <Moon className="h-4 w-4" />
                <span className="ml-2">Dark</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="system" aria-label="System theme">
                <Monitor className="h-4 w-4" />
                <span className="ml-2">System</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Interface</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                <Label htmlFor="show-shortcuts">Show keyboard shortcuts</Label>
              </div>
              <Switch
                id="show-shortcuts"
                checked={showShortcuts}
                onCheckedChange={setShowShortcuts}
              />
            </div>
          </div>
          <OllamaSettings />
          <AssistantSettings />
        </div>
      </DialogContent>
    </Dialog>
  );
}
