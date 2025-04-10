import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConnectionStatus } from '../../chat/components/connection-status';
import { useChatSettingsStore } from '@/features/chat/store/chat-settings-store';

export function OllamaSettings() {
  const ollamaUrl = useChatSettingsStore(state => state.ollamaUrl);
  const setOllamaUrl = useChatSettingsStore(state => state.setOllamaUrl);
  const selectedModel = useChatSettingsStore(state => state.assistantSettings.model);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2">
          <CardTitle className="flex items-center justify-between">
            <span>Ollama Settings</span>
            <ConnectionStatus url={ollamaUrl} />
          </CardTitle>
          {selectedModel && (
            <div className="text-sm text-muted-foreground">
              Selected Model: <span className="font-medium">{selectedModel}</span>
            </div>
          )}
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
            onChange={e => setOllamaUrl(e.target.value)}
            placeholder="http://localhost:11434"
          />
        </div>
      </CardContent>
    </Card>
  );
}
