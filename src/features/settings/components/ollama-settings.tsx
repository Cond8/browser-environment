// src/features/settings/components/ollama-settings.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectedModel } from '../../chat/components/selected-model';
import { useAssistantConfigStore } from '../../chat/store/assistant-config-store';

export function OllamaSettings() {
  const { ollamaUrl, setUrl } = useAssistantConfigStore();

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
            onChange={e => setUrl(e.target.value)}
            placeholder="http://localhost:11434"
          />
        </div>

        <SelectedModel />
      </CardContent>
    </Card>
  );
}
