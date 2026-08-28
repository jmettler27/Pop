import { useRef, useState } from 'react';

export default function useAsyncAction<TArgs extends unknown[] = unknown[]>(
  asyncAction: (...args: TArgs) => Promise<void>
): [(...args: TArgs) => Promise<void>, boolean, Error | null] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isRunningRef = useRef(false);

  const execute = async (...args: TArgs): Promise<void> => {
    // Re-entrancy guard: ignore calls that arrive while a previous run is still in
    // flight (e.g. a double/triple click landing before `isLoading` disables the button).
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      await asyncAction(...args);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw err;
    } finally {
      isRunningRef.current = false;
      setIsLoading(false);
    }
  };

  return [execute, isLoading, error];
}
