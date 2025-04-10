import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAssistantStore } from '../store/assistant-store';
import { useOllamaStore } from '../store/ollama-store';
import { useEffect } from 'react';

export function SelectedModel() {
  const { selectedModel, setSelectedModel } = useAssistantStore();
  const { availableModels, isLoadingModels, fetchModels } = useOllamaStore();

  // Fetch available models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Model:</span>
      <Select
        value={selectedModel || ''}
        onValueChange={setSelectedModel}
        disabled={isLoadingModels}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {isLoadingModels ? (
            <SelectItem value="loading" disabled>
              Loading models...
            </SelectItem>
          ) : availableModels.length === 0 ? (
            <SelectItem value="no-models" disabled>
              No models available
            </SelectItem>
          ) : (
            availableModels.map(model => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
} 