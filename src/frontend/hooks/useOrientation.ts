'use client';

import { useEffect, useState } from 'react';

export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

export default function useOrientation(): Orientation | null {
  const [orientation, setOrientation] = useState<Orientation | null>(null);

  useEffect(() => {
    const mql = window.matchMedia('(orientation: portrait)');
    setOrientation(mql.matches ? Orientation.PORTRAIT : Orientation.LANDSCAPE);
    const handler = (e: MediaQueryListEvent) =>
      setOrientation(e.matches ? Orientation.PORTRAIT : Orientation.LANDSCAPE);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return orientation;
}
