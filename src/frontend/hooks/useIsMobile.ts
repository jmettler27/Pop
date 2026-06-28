'use client';

import { useEffect, useState } from 'react';

export default function useIsMobile(breakpoint = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${breakpoint - 1}px), (orientation: landscape) and (max-height: ${breakpoint - 1}px)`
    );
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
