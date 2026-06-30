'use client';

import { useSyncExternalStore } from 'react';

export default function useIsMobile(breakpoint = 768): boolean | null {
  const query = `(max-width: ${breakpoint - 1}px), (orientation: landscape) and (max-height: ${breakpoint - 1}px)`;

  const subscribe = (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  };

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => null;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
