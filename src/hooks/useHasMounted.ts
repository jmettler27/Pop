'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

// True once the component has hydrated on the client. Useful to defer rendering
// of content that would otherwise mismatch between server and client renders.
export default function useHasMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
