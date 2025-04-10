import React from 'react';
import { Button } from '@/components/ui/button';

interface DisconnectedScreenProps {
  error?: string;
  onRetry: () => void;
}

export const DisconnectedScreen: React.FC<DisconnectedScreenProps> = ({
  error,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-24 h-24 mb-4 text-red-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
      <p className="text-gray-500 max-w-sm mb-4">
        {error || 'Failed to connect to the service. Please check your connection and try again.'}
      </p>
      <Button onClick={onRetry} className="mt-4">
        Retry Connection
      </Button>
    </div>
  );
}; 