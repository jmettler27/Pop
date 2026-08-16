export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds?: number;
}

export function timestampToLongDateTime(
  timestamp: FirestoreTimestamp | null | undefined,
  locale?: string
): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    weekday: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timestampToNumericDate(
  timestamp: FirestoreTimestamp | null | undefined,
  locale?: string
): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp.seconds * 1000);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .filter((part) => part.type === 'year' || part.type === 'month' || part.type === 'day')
    .map((part) => part.value)
    .join('-');
}

export function timestampToShortTime(timestamp: FirestoreTimestamp | null | undefined, locale?: string): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timestampElapsedSeconds(
  start: FirestoreTimestamp | null | undefined,
  end?: FirestoreTimestamp
): number {
  if (!start) return 0;
  const startMs = start.seconds * 1000;
  const endMs = end ? end.seconds * 1000 : Date.now();
  return Math.max(0, Math.round((endMs - startMs) / 1000));
}

export function formatDuration(totalSeconds: number, locale: string): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Intl as any).DurationFormat(locale, { style: 'narrow' }).format({ minutes, seconds });
}
