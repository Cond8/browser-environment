import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConnectionStatus } from '../../chat/components/connection-status';
import { useOllamaStore } from '@/features/chat/store/ollama-store';
import { useEffect } from 'react';
import { SelectedModel } from '../../chat/components/selected-model';

export function OllamaSettings() {
  const { 
    availableModels, 
    isLoadingModels,
    ollamaUrl,
    setOllamaUrl,
    checkConnection,
    fetchModels
  } = useOllamaStore();

  // Check connection and fetch models on mount
  useEffect(() => {
    checkConnection();
    fetchModels();
  }, []);

  const handleUrlChange = (url: string) => {
    setOllamaUrl(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2">
          <CardTitle className="flex items-center justify-between">
            <span>Ollama Settings</span>
            <ConnectionStatus />
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="ollama-url" className="text-sm font-medium">
              Ollama URL
            </label>
          </div>
          <Input
            id="ollama-url"
            value={ollamaUrl}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="http://localhost:11434"
          />
        </div>
        <SelectedModel />
        {isLoadingModels ? (
          <div className="text-sm text-muted-foreground">Loading available models...</div>
        ) : availableModels.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Models</div>
            <div className="text-sm text-muted-foreground">
              {availableModels.join(', ')}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
