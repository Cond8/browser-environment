import React, { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChatSettingsStore } from '../store/chat-settings-store';

export const SelectedModel: React.FC = () => {
  const { assistantSettings: ollamaSettings, setOllamaSettings, availableModels, fetchAvailableModels } = useChatSettingsStore();
  const ollamaUrl = useChatSettingsStore(state => state.ollamaUrl);

  useEffect(() => {
    fetchAvailableModels(ollamaUrl);
  }, [ollamaUrl, fetchAvailableModels]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
          Model: <span className="font-medium">{ollamaSettings.model}</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {availableModels.isLoading ? (
          <DropdownMenuItem disabled>Loading models...</DropdownMenuItem>
        ) : availableModels.error ? (
          <DropdownMenuItem disabled className="text-destructive">
            {availableModels.error}
          </DropdownMenuItem>
        ) : (
          availableModels.models.map((availableModel) => (
            <DropdownMenuItem
              key={availableModel}
              onClick={() => setOllamaSettings({ model: availableModel })}
              className={ollamaSettings.model === availableModel ? 'bg-accent' : ''}
            >
              {availableModel}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
