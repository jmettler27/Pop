export const isObjectEmpty = (obj: Record<string, unknown>): boolean => {
  return Object.keys(obj).length === 0;
};

/** Shallow copy of `obj` without the given keys. */
export const omit = (obj: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> => {
  const excluded = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !excluded.has(key)));
};
