// src/features/chat/components/assistant-display.tsx
import { cn } from '@/lib/utils';

type MessageDisplayProps = {
  content: string;
  type: 'alignment' | 'interface' | 'step';
};

export const AssistantDisplay = ({ content, type }: MessageDisplayProps) => {
  return <div className={cn('p-4', 'bg-muted/30')}>{content}</div>;
};
