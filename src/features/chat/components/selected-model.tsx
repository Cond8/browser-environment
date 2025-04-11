import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useOllamaStore } from '../store/ollama-store';
import { useState, useEffect } from 'react';

export function SelectedModel() {
  const { selectedModel, setSelectedModel } = useAssistantConfigStore();
  const { models, isLoading, fetchModels, error } = useOllamaStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchModels(true); // force = true
    } catch (err) {
      console.error('Failed to refresh models:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Optionally prefetch models on mount if not yet loaded
  useEffect(() => {
    if (!models) {
      fetchModels().catch(console.error);
    }
  }, [models, fetchModels]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Model:</span>
      <Select
        value={selectedModel || ''}
        onValueChange={setSelectedModel}
        disabled={isLoading || isRefreshing}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {isLoading || isRefreshing ? (
            <SelectItem value="loading" disabled>
              Loading models...
            </SelectItem>
          ) : error ? (
            <SelectItem value="error" disabled>
              {error}
            </SelectItem>
          ) : !models || models.length === 0 ? (
            <SelectItem value="no-models" disabled>
              No models available
            </SelectItem>
          ) : (
            models.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing || isLoading}
      >
        <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
