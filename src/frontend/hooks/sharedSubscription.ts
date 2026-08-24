// Firestore/RTDB listeners are opened per hook call by default, so N components subscribing to the same
// key would otherwise open N independent (and separately-billed) connections. This registry makes the
// underlying listener a refcounted singleton per key: the first caller for a key opens it for real, later
// callers for the same key just add a reference and share the result, and the listener closes only when
// the last one leaves.
type Unsubscribe = () => void;

interface SharedEntry {
  refCount: number;
  unsubscribe: Unsubscribe;
}

const registry = new Map<string, SharedEntry>();

// Call from inside a useEffect and return the result as its cleanup function. `subscribe` runs only when
// no one else already holds `key` open; later callers for the same key skip straight to the ref-count.
export function acquireSharedSubscription(key: string, subscribe: () => Unsubscribe): Unsubscribe {
  let entry = registry.get(key);
  if (!entry) {
    entry = { refCount: 0, unsubscribe: subscribe() };
    registry.set(key, entry);
  }
  entry.refCount += 1;

  // Guards against a cleanup being invoked more than once for the same acquire (React only does this
  // once per effect instance, but a stray extra call must not decrement the shared count twice).
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = registry.get(key);
    if (!current) return;
    current.refCount -= 1;
    if (current.refCount === 0) {
      current.unsubscribe();
      registry.delete(key);
    }
  };
}
