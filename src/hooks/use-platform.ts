import { useEffect, useState } from 'react';

export type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('unknown');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.includes('mac')) {
      setPlatform('mac');
    } else if (userAgent.includes('win')) {
      setPlatform('windows');
    } else if (userAgent.includes('linux')) {
      setPlatform('linux');
    } else {
      setPlatform('unknown');
    }
  }, []);

  return platform;
}
