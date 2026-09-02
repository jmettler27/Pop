'use client';

import { useSyncExternalStore } from 'react';

export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

export default function useOrientation(): Orientation | null {
  const subscribe = (onChange: () => void) => {
    const mql = window.matchMedia('(orientation: portrait)');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  };

  const getSnapshot = () =>
    window.matchMedia('(orientation: portrait)').matches ? Orientation.PORTRAIT : Orientation.LANDSCAPE;
  const getServerSnapshot = () => null;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
