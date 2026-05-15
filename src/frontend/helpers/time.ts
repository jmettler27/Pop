export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds?: number;
}

export function timestampToDate(timestamp: FirestoreTimestamp | null | undefined, locale?: string): string | null {
  if (!timestamp) return null;
  return new Date(timestamp.seconds * 1000).toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    weekday: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timestampToDate1(timestamp: FirestoreTimestamp | null | undefined): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp.seconds * 1000);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${year}/${month}/${day}`;
}

export function timestampToHour(timestamp: FirestoreTimestamp | null | undefined, locale?: string): string | null {
  if (!timestamp) return null;
  return new Date(timestamp.seconds * 1000).toLocaleString(locale, {
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

export function formatSecondsToMinutesAndSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}
