import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutsDisplayProps {
  command: string;
  shortcut: string;
  chained?: boolean;
  hide?: boolean;
  className?: string;
}

export function ShortcutsDisplay({ command, shortcut, chained = false, hide = false, className }: ShortcutsDisplayProps) {
  return (
    <div className={cn(
      'flex items-center gap-1 text-xs text-muted-foreground transition-opacity duration-200',
      hide ? 'opacity-0 w-0' : 'opacity-100 w-auto',
      className
    )}>
      {chained ? <b className="pr-1">/</b> :<Keyboard className="h-3 w-3" />}
      <span>{command}</span>
      <span>•</span>
      <span>{shortcut}</span>
    </div>
  );
} 