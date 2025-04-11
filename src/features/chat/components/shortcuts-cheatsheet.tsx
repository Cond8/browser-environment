import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShortcutsDisplay } from './shortcuts-display';

interface ShortcutItem {
  command: string;
  shortcut: string;
  chained?: boolean;
}

interface ShortcutsCheatsheetProps {
  shortcuts: ShortcutItem[];
  className?: string;
}

export function ShortcutsCheatsheet({ shortcuts, className }: ShortcutsCheatsheetProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Keyboard className="h-4 w-4" />
        <span>Keyboard Shortcuts</span>
      </div>
      <div className="grid gap-2">
        {shortcuts.map((shortcut, index) => (
          <ShortcutsDisplay
            key={index}
            command={shortcut.command}
            shortcut={shortcut.shortcut}
            chained={shortcut.chained}
          />
        ))}
      </div>
    </div>
  );
} 