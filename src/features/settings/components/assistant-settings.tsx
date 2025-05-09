// src/features/settings/components/assistant-settings.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAssistantConfigStore } from '@/features/chat/store/assistant-config-store';
import { RefreshCw } from 'lucide-react';

export function AssistantSettings() {
  const { parameters, setParameters, resetParameters } = useAssistantConfigStore();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assistant Parameters</CardTitle>
          <Button variant="ghost" size="sm" onClick={resetParameters} className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="core">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="core">Core Parameters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="temperature" className="text-sm font-medium">
                  Temperature
                </label>
                <span className="text-sm text-muted-foreground">{parameters.temperature}</span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={[parameters.temperature ?? 0.8]}
                onValueChange={([value]) => setParameters({ temperature: value })}
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness. Higher values make the output more random.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="topP" className="text-sm font-medium">
                  Top P
                </label>
                <span className="text-sm text-muted-foreground">{parameters.top_p}</span>
              </div>
              <Slider
                id="topP"
                min={0}
                max={1}
                step={0.1}
                value={[parameters.top_p ?? 0.8]}
                onValueChange={([value]) => setParameters({ top_p: value })}
              />
              <p className="text-xs text-muted-foreground">
                Controls diversity via nucleus sampling. Lower values make the output more focused.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="topK" className="text-sm font-medium">
                  Top K
                </label>
                <span className="text-sm text-muted-foreground">{parameters.top_k}</span>
              </div>
              <Slider
                id="topK"
                min={0}
                max={100}
                step={1}
                value={[parameters.top_k ?? 0]}
                onValueChange={([value]) => setParameters({ top_k: value })}
              />
              <p className="text-xs text-muted-foreground">
                Controls diversity by limiting the number of tokens considered at each step.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="numPredict" className="text-sm font-medium">
                  Max Tokens
                </label>
                <span className="text-sm text-muted-foreground">{parameters.num_predict}</span>
              </div>
              <Slider
                id="numPredict"
                min={1}
                max={4096}
                step={1}
                value={[parameters.num_predict ?? 0]}
                onValueChange={([value]) => setParameters({ num_predict: value })}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens to generate in the response.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="repeatPenalty" className="text-sm font-medium">
                  Repeat Penalty
                </label>
                <span className="text-sm text-muted-foreground">{parameters.repeat_penalty}</span>
              </div>
              <Slider
                id="repeatPenalty"
                min={0.9}
                max={2.0}
                step={0.1}
                value={[parameters.repeat_penalty ?? 0]}
                onValueChange={([value]) => setParameters({ repeat_penalty: value })}
              />
              <p className="text-xs text-muted-foreground">
                Controls how strongly to penalize repetitions. Higher values penalize more strongly.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="repeatLastN" className="text-sm font-medium">
                  Repeat Last N
                </label>
                <span className="text-sm text-muted-foreground">{parameters.repeat_last_n}</span>
              </div>
              <Slider
                id="repeatLastN"
                min={0}
                max={128}
                step={1}
                value={[parameters.repeat_last_n ?? 0]}
                onValueChange={([value]) => setParameters({ repeat_last_n: value })}
              />
              <p className="text-xs text-muted-foreground">
                How far back to look for preventing repetition. 0 = disabled.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="tfsZ" className="text-sm font-medium">
                  TFS Z
                </label>
                <span className="text-sm text-muted-foreground">{parameters.tfs_z}</span>
              </div>
              <Slider
                id="tfsZ"
                min={1.0}
                max={2.0}
                step={0.1}
                value={[parameters.tfs_z ?? 0]}
                onValueChange={([value]) => setParameters({ tfs_z: value })}
              />
              <p className="text-xs text-muted-foreground">
                Tail free sampling parameter. Higher values reduce impact of less probable tokens.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="mirostat" className="text-sm font-medium">
                  Mirostat
                </label>
                <span className="text-sm text-muted-foreground">{parameters.mirostat ?? 0}</span>
              </div>
              <Slider
                id="mirostat"
                min={0}
                max={2}
                step={1}
                value={[parameters.mirostat ?? 0]}
                onValueChange={([value]) => setParameters({ mirostat: value })}
              />
              <p className="text-xs text-muted-foreground">
                Enable Mirostat sampling (0 = disabled, 1 = Mirostat, 2 = Mirostat 2.0).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="mirostatEta" className="text-sm font-medium">
                  Mirostat Eta
                </label>
                <span className="text-sm text-muted-foreground">
                  {parameters.mirostat_eta ?? 0}
                </span>
              </div>
              <Slider
                id="mirostatEta"
                min={0.01}
                max={1.0}
                step={0.01}
                value={[parameters.mirostat_eta ?? 0]}
                onValueChange={([value]) => setParameters({ mirostat_eta: value })}
              />
              <p className="text-xs text-muted-foreground">
                Learning rate for Mirostat. Lower values make adjustments slower.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="mirostatTau" className="text-sm font-medium">
                  Mirostat Tau
                </label>
                <span className="text-sm text-muted-foreground">
                  {parameters.mirostat_tau ?? 0}
                </span>
              </div>
              <Slider
                id="mirostatTau"
                min={0}
                max={10}
                step={0.1}
                value={[parameters.mirostat_tau ?? 0]}
                onValueChange={([value]) => setParameters({ mirostat_tau: value })}
              />
              <p className="text-xs text-muted-foreground">
                Controls balance between coherence and diversity in Mirostat.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="numCtx" className="text-sm font-medium">
                  Context Window
                </label>
                <span className="text-sm text-muted-foreground">{parameters.num_ctx}</span>
              </div>
              <Slider
                id="numCtx"
                min={512}
                max={8192}
                step={512}
                value={[parameters.num_ctx ?? 0]}
                onValueChange={([value]) => setParameters({ num_ctx: value })}
              />
              <p className="text-xs text-muted-foreground">
                Size of the context window used to generate the next token.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
