import { useMemo } from 'react';

import {
  collection,
  doc,
  limit as fsLimit,
  orderBy,
  query,
  where,
  type Query,
  type WhereFilterOp,
} from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';
import { useFirestoreCollection, useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type RoundType } from '@/models/rounds/round-type';
import RoundFactory from '@/models/rounds/RoundFactory';

interface QueryOptions {
  where?: { field: string; operator: WhereFilterOp; value: unknown };
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

function roundsRef(gameId: string) {
  return collection(firestore, 'games', gameId, 'rounds');
}

function buildRoundQuery(gameId: string, options: QueryOptions): Query {
  let q: Query = query(roundsRef(gameId));
  if (options.where) {
    q = query(q, where(options.where.field, options.where.operator, options.where.value));
  }
  if (options.orderBy) {
    q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
  }
  if (options.limit) {
    q = query(q, fsLimit(options.limit));
  }
  return q;
}

function queryOptionsKey(options: QueryOptions): readonly unknown[] {
  return [
    options.where?.field ?? null,
    options.where?.operator ?? null,
    options.where?.value ?? null,
    options.orderBy?.field ?? null,
    options.orderBy?.direction ?? null,
    options.limit ?? null,
  ];
}

// Memoized on `data` (mirrors useGame/useAllPlayers) so `round`/`rounds` stay referentially stable across
// renders when the underlying document(s) haven't changed.
export function useRound(gameId: string | null, roundId: string) {
  const { data, isLoading, error } = useFirestoreDocument(gameId ? doc(roundsRef(gameId), roundId) : null);
  const round = useMemo(() => (data ? RoundFactory.createRound(data.type as RoundType, data) : null), [data]);
  return { round, loading: isLoading, error };
}

export function useRoundOnce(gameId: string | null, roundId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(gameId ? doc(roundsRef(gameId), roundId) : null);
  const round = useMemo(() => (data ? RoundFactory.createRound(data.type as RoundType, data) : null), [data]);
  return { round, loading: isLoading, error };
}

export function useAllRounds(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollection(gameId ? query(roundsRef(gameId)) : null, [
    gameId,
    'rounds',
  ]);
  const rounds = useMemo(() => data?.map((r) => RoundFactory.createRound(r.type as RoundType, r)) ?? [], [data]);
  return { rounds, loading: isLoading, error };
}

export function useAllRoundsOnce(gameId: string | null, queryOptions: QueryOptions = {}) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(gameId ? buildRoundQuery(gameId, queryOptions) : null, [
    gameId,
    'rounds',
    ...queryOptionsKey(queryOptions),
  ]);
  const rounds = useMemo(() => data?.map((r) => RoundFactory.createRound(r.type as RoundType, r)) ?? [], [data]);
  return { rounds, loading: isLoading, error };
}
