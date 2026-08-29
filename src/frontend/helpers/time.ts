export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds?: number;
}

/**
 * Null-safe Firestore-timestamp → Date. react-intl's `formatDate` / `formatTime` default a
 * missing value to "now", so callers convert first and guard on null themselves, then format
 * via `intl.formatDate` / `intl.formatTime` (named formats registered in `LocaleProvider`).
 */
export function timestampToDate(timestamp: FirestoreTimestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  return new Date(timestamp.seconds * 1000);
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
  // react-intl has no duration formatter; `Intl.DurationFormat` isn't in the TS lib yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Intl as any).DurationFormat(locale, { style: 'narrow' }).format({ minutes, seconds });
}
