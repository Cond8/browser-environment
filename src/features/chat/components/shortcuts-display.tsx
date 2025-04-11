import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/hooks/use-platform';

interface ShortcutsDisplayProps {
  command: string;
  shortcut: string;
  chained?: boolean;
  hide?: boolean;
  className?: string;
  asButton?: boolean;
  onClick?: () => void;
}

export function ShortcutsDisplay({ 
  command, 
  shortcut, 
  chained = false, 
  hide = false, 
  className,
  asButton = false,
  onClick
}: ShortcutsDisplayProps) {
  const platform = usePlatform();
  const modifier = platform === 'mac' ? '⌘' : 'Ctrl+';
  const displayShortcut = shortcut.replace('⌘', modifier);

  const content = (
    <>
      {chained ? <b className="pr-1">/</b> :<Keyboard className="h-3 w-3" />}
      <span>{command}</span>
      <span>•</span>
      <span>{displayShortcut}</span>
    </>
  );

  const classes = cn(
    'flex items-center gap-1 text-xs text-muted-foreground transition-opacity duration-200',
    hide ? 'opacity-0 w-0' : 'opacity-100 w-auto',
    className
  );

  if (asButton) {
    return (
      <Button
        variant="ghost"
        size="sm"
        asChild
      >
        <div className={classes} onClick={onClick}>
          {content}
        </div>
      </Button>
    );
  }

  return (
    <div className={classes}>
      {content}
    </div>
  );
} 