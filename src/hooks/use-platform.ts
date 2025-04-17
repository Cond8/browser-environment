// src/hooks/use-platform.ts
import { useEffect, useState } from 'react';

export type Platform = 'mac' | 'windows';

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('windows');

  useEffect(() => {
    // Check if the platform is Mac
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    setPlatform(isMac ? 'mac' : 'windows');
  }, []);

  return platform;
}
