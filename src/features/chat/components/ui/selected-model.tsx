// src/features/chat/components/ui/selected-model.tsx
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { ModelResponse } from 'ollama/browser';
import { useCallback, useEffect, useState } from 'react';
import { fetchModels } from '../../../ollama-api/fetch-models';
import { useAssistantConfigStore } from '../../store/assistant-config-store';

export function SelectedModel() {
  const { selectedModel, setSelectedModel, ollamaUrl } = useAssistantConfigStore();
  const [models, setModels] = useState<ModelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
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
  }, [ollamaUrl]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadModels();
    }, 400); // 400ms debounce
    return () => {
      clearTimeout(handler);
    };
  }, [ollamaUrl, loadModels]);

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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
