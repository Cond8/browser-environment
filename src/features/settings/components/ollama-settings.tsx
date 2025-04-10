import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSettingsStore } from "../store/settings"
import { useEffect, useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"

export function OllamaSettings() {
  const { ollamaUrl, setOllamaUrl } = useSettingsStore()
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${ollamaUrl}/api/tags`)
        setIsConnected(response.ok)
      } catch (error) {
        setIsConnected(false)
      }
    }

    checkConnection()
  }, [ollamaUrl])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Ollama Settings
          {isConnected === true && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          {isConnected === false && (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="ollama-url" className="text-sm font-medium">
              Ollama URL
            </label>
            <span className="text-xs text-muted-foreground">
              {isConnected === true ? "Connected" : isConnected === false ? "Not connected" : "Checking..."}
            </span>
          </div>
          <Input
            id="ollama-url"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            placeholder="http://localhost:11434"
          />
        </div>
      </CardContent>
    </Card>
  )
} 