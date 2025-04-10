import { ComposerPrimitive } from '@assistant-ui/react';
import { SendHorizontalIcon } from 'lucide-react';
import { FC, useState } from 'react';
import { useChatStore } from '../store/chat-store';
import { TooltipIconButton } from './ui/tooltip-icon-button';

interface UserInputProps {
  placeholder?: string;
  autoFocus?: boolean;
}

export const UserInput: FC<UserInputProps> = ({
  placeholder = 'Write a message...',
  autoFocus = true,
}) => {
  const [isSending, setIsSending] = useState(false);
  const sendMessage = useChatStore(state => state.sendMessage);

  const handleSend = async () => {
    const input = document.querySelector('textarea')?.value;
    if (!input?.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(input);
      // Clear input after sending
      if (document.querySelector('textarea')) {
        document.querySelector('textarea')!.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ComposerPrimitive.Root className="focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border-2 border-border bg-background px-2.5 shadow-md transition-colors ease-in hover:border-border-hover">
      <ComposerPrimitive.Input
        rows={3}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="placeholder:text-muted-foreground max-h-60 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
        disabled={isSending}
      />
      <ComposerPrimitive.Send asChild>
        <TooltipIconButton
          tooltip="Send"
          variant="default"
          className="my-2.5 size-8 p-2 transition-opacity ease-in"
          onClick={handleSend}
          disabled={isSending}
        >
          <SendHorizontalIcon />
        </TooltipIconButton>
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}; 