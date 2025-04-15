import { cn } from '@/lib/utils';

type UserDisplayProps = {
  content: string;
};

export const UserDisplay = ({ content }: UserDisplayProps) => {
  return <div className={cn('p-4', 'bg-card')}>{content}</div>;
};
