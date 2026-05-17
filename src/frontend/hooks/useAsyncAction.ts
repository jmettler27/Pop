import { useState } from 'react';

export default function useAsyncAction<TArgs extends unknown[] = unknown[]>(
  asyncAction: (...args: TArgs) => Promise<void>
): [(...args: TArgs) => Promise<void>, boolean, Error | null] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (...args: TArgs): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await asyncAction(...args);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return [execute, isLoading, error];
}
