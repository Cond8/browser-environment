import { useEffect, useState } from 'react';

interface ConnectionStatusProps {
  url: string;
  checkEndpoint?: string;
  checkInterval?: number;
}

export function ConnectionStatus({
  url,
  checkEndpoint = '/api/tags',
  checkInterval = 5000,
}: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${url}${checkEndpoint}`);
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      }
    };

    // Initial check
    checkConnection();

    // Set up periodic checks
    const intervalId = setInterval(checkConnection, checkInterval);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [url, checkEndpoint, checkInterval]);

  return (
    <div className="flex items-center gap-1">
      {isConnected === true ? (
        <div className="h-2 w-2 rounded-full bg-green-500" />
      ) : (
        <div className="h-2 w-2 rounded-full bg-red-500" />
      )}
      <span className="text-xs text-muted-foreground">
        {isConnected === true
          ? 'Connected'
          : isConnected === false
            ? 'Not connected'
            : 'Checking...'}
      </span>
    </div>
  );
}
