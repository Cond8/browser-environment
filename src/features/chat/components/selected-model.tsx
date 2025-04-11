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
import { OllamaModel } from '../services/ollama-types';
import { fetchModels } from '../ollama-api/fetch-models';

export function SelectedModel() {
  const { selectedModel, setSelectedModel, ollamaUrl } = useAssistantConfigStore();
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedModels = await fetchModels(ollamaUrl);
      setModels(fetchedModels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, [ollamaUrl]);

  const handleRefresh = () => {
    loadModels();
  };

  const renderModelList = () => {
    if (isLoading) {
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
        key={model.name}
        onClick={() => setSelectedModel(model.name)}
        className={cn('cursor-pointer', selectedModel === model.name && 'bg-accent')}
      >
        {model.name}
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
            disabled={isLoading}
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
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RotateCcw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            Refresh models
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
