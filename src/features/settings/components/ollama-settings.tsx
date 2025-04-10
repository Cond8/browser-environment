import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useOllamaStore } from '@/features/chat/store/ollama-store';
import { SelectedModel } from '../../chat/components/selected-model';

export function OllamaSettings() {
  const {
    models,
    isLoading,
    ollamaUrl,
    setUrl, // new setter name
    error,
  } = useOllamaStore();

  const handleUrlChange = (url: string) => {
    setUrl(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2">
          <CardTitle className="flex items-center justify-between">
            <span>Ollama Settings</span>
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

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading available models...</div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : models && models.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Models</div>
            <div className="text-sm text-muted-foreground">
              {models.join(', ')}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No models available</div>
        )}
      </CardContent>
    </Card>
  );
}
