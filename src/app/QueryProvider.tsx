'use client';

import { useState, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // "Once" reads are fetch-once by design; "live" reads are kept fresh by onSnapshot, not refetch
      // heuristics — staleTime: Infinity as the default covers both without disabling refetchOnWindowFocus
      // etc. individually. Server-action-backed queries (e.g. the question bank) set their own staleTime.
      queries: { staleTime: Infinity },
    },
  });
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  // One QueryClient per browser tab's component-tree lifetime via useState's lazy initializer — NOT a
  // module-level singleton, which would be constructed once per server process and shared across every
  // concurrent request/user during the server-rendered pass.
  const [queryClient] = useState(makeQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
