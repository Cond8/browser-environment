import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown } from 'lucide-react';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useOllamaStore } from '../store/ollama-store';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function SelectedModel() {
  const { selectedModel, setSelectedModel } = useAssistantConfigStore();
  const { models, isLoading, fetchModels, error } = useOllamaStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchModels(true);
    } catch (err) {
      console.error('Failed to refresh models:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!models) {
      fetchModels().catch(console.error);
    }
  }, [models, fetchModels]);

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            disabled={isLoading || isRefreshing}
          >
            {selectedModel || 'Select model'}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {isLoading || isRefreshing ? (
            <DropdownMenuItem disabled>
              Loading models...
            </DropdownMenuItem>
          ) : error ? (
            <DropdownMenuItem disabled>
              {error}
            </DropdownMenuItem>
          ) : !models || models.length === 0 ? (
            <DropdownMenuItem disabled>
              No models available
            </DropdownMenuItem>
          ) : (
            models.map((model) => (
              <DropdownMenuItem
                key={model}
                onClick={() => setSelectedModel(model)}
                className={cn(
                  "cursor-pointer",
                  selectedModel === model && "bg-accent"
                )}
              >
                {model}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2"
          >
            <RotateCcw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Refresh models
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
