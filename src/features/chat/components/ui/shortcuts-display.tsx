// src/features/chat/components/ui/shortcuts-display.tsx
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/features/settings/store/settings';
import { usePlatform } from '@/hooks/use-platform';
import { cn } from '@/lib/utils';
import { Keyboard, LucideIcon } from 'lucide-react';

interface ShortcutsDisplayProps {
  command: string;
  shortcut: string;
  chained?: boolean;
  hide?: boolean;
  className?: string;
  asButton?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
}

export function ShortcutsDisplay({
  command,
  shortcut,
  chained = false,
  hide = false,
  className,
  asButton = false,
  onClick,
  icon: Icon = Keyboard,
}: ShortcutsDisplayProps) {
  const platform = usePlatform();
  const showShortcuts = useSettingsStore(state => state.showShortcuts);
  const displayShortcut = shortcut
    .replace('⌘', platform === 'mac' ? '⌘' : 'Ctrl+')
    .replace('⇧', platform === 'mac' ? '⇧' : 'Shift+');

  const content = (
    <>
      {chained ? <b className="pr-1">/</b> : <Icon className="h-3 w-3" />}
      <span>{command}</span>
      {showShortcuts && (
        <>
          <span>•</span>
          <span>{displayShortcut}</span>
        </>
      )}
    </>
  );

  const classes = cn(
    'flex items-center gap-1 text-xs text-muted-foreground transition-opacity duration-200',
    hide ? 'opacity-0 w-0' : 'opacity-100 w-auto',
    className,
  );

  if (asButton) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <div className={classes} onClick={onClick}>
          {content}
        </div>
      </Button>
    );
  }

  return <div className={classes}>{content}</div>;
}
