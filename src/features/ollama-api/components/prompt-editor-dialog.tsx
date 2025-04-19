import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePromptStore } from '../stores/prompt-store';

interface PromptEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: 1 | 2 | 3 | 4;
}

const STEP_LABELS = {
  1: 'Step 1: Enrich',
  2: 'Step 2: Analyze',
  3: 'Step 3: Decide',
  4: 'Step 4: Format',
};

export function PromptEditorDialog({ open, onOpenChange, step }: PromptEditorDialogProps) {
  const prompt = usePromptStore(state => {
    if (step === 1) return state.step1Prompt;
    if (step === 2) return state.step2Prompt;
    if (step === 3) return state.step3Prompt;
    return state.step4Prompt;
  });
  const setPrompt = usePromptStore(state => state.setPrompt);
  const [value, setValue] = React.useState(prompt);

  React.useEffect(() => {
    setValue(prompt);
  }, [prompt, step]);

  const handleSave = () => {
    setPrompt(step, value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Prompt - {STEP_LABELS[step]}</DialogTitle>
        </DialogHeader>
        <Textarea
          className="min-h-[200px]"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
        <div className="text-xs text-muted-foreground mt-2">
          You can use <code>{'{{userRequest}}'}</code> and <code>{'{{interfaceResponse}}'}</code> in Step 1 prompt for dynamic values.
        </div>
      </DialogContent>
    </Dialog>
  );
}
