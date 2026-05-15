'use client';

import { useEffect, useRef, useState } from 'react';

import { useCollectionQuery, useDocumentQuery } from '@tanstack-query-firebase/react/firestore';
import { onSnapshot, queryEqual } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Real-time document hooks (onSnapshot)
// ---------------------------------------------------------------------------

function useRealtimeDocumentSnapshot(docRef) {
  const [state, setState] = useState({ data: undefined, loading: true, error: undefined });

  useEffect(() => {
    if (!docRef) {
      setState({ data: undefined, loading: false, error: undefined });
      return;
    }
    return onSnapshot(
      docRef,
      (snap) => setState({ data: snap, loading: false, error: undefined }),
      (err) => setState({ data: undefined, loading: false, error: err })
    );
  }, [docRef?.path]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

// Handles Firestore Query objects that may be recreated each render.
// Uses queryEqual to avoid unnecessary resubscriptions.
function useRealtimeCollectionSnapshot(q) {
  const [state, setState] = useState({ data: undefined, loading: true, error: undefined });
  const subscriptionRef = useRef(null);
  const prevQueryRef = useRef(undefined);

  useEffect(() => {
    if (prevQueryRef.current && queryEqual(prevQueryRef.current, q)) return;

    subscriptionRef.current?.();
    prevQueryRef.current = q;

    if (!q) {
      setState({ data: undefined, loading: false, error: undefined });
      return;
    }

    subscriptionRef.current = onSnapshot(
      q,
      (snap) => setState({ data: snap, loading: false, error: undefined }),
      (err) => setState({ data: undefined, loading: false, error: err })
    );
  }); // runs every render; queryEqual guards against resubscription

  // Cancel subscription on unmount
  useEffect(() => () => subscriptionRef.current?.(), []);

  return state;
}

// ---------------------------------------------------------------------------
// Exported hooks — drop-in replacements for react-firebase-hooks/firestore
// Return shape is { data, loading, error } (objects, not arrays)
// ---------------------------------------------------------------------------

/** Real-time DocumentSnapshot subscription */
export function useDocument(docRef) {
  return useRealtimeDocumentSnapshot(docRef);
}

/** One-time DocumentSnapshot fetch */
export function useDocumentOnce(docRef) {
  const {
    data,
    isPending: loading,
    error,
  } = useDocumentQuery(docRef, {
    queryKey: [docRef?.path, 'once'],
  });
  return { data, loading, error };
}

/** Real-time QuerySnapshot subscription */
export function useCollection(q) {
  return useRealtimeCollectionSnapshot(q);
}

/**
 * One-time QuerySnapshot fetch.
 * @param {Query} q
 * @param {import('@tanstack/react-query').QueryKey} queryKey - stable cache key
 */
export function useCollectionOnce(q, queryKey) {
  const { data, isPending: loading, error } = useCollectionQuery(q, { queryKey });
  return { data, loading, error };
}
