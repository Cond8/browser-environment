// src/features/chat/components/selected-model.tsx
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAssistantConfigStore } from '../store/assistant-config-store';
import { useOllamaStore } from '../store/ollama-store';

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

  const renderModelList = () => {
    if (isLoading || isRefreshing) {
      return <DropdownMenuItem disabled>Loading models...</DropdownMenuItem>;
    }

    if (error) {
      return <DropdownMenuItem disabled>{error}</DropdownMenuItem>;
    }

    if (!models || models.length === 0) {
      return <DropdownMenuItem disabled>No models available</DropdownMenuItem>;
    }

    return models.map(model => (
      <DropdownMenuItem
        key={model}
        onClick={() => setSelectedModel(model)}
        className={cn('cursor-pointer', selectedModel === model && 'bg-accent')}
      >
        {model}
      </DropdownMenuItem>
    ));
  };

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
          {renderModelList()}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2"
          >
            <RotateCcw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            Refresh models
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
