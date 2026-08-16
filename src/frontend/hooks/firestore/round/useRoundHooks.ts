import { limit as fsLimit, orderBy, query, where, type Query } from 'firebase/firestore';

import type { QueryOptions } from '@/backend/repositories/FirebaseRepository';
import type RoundRepository from '@/backend/repositories/round/RoundRepository';
import { useFirestoreCollection, useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type RoundType } from '@/models/rounds/round-type';
import RoundFactory from '@/models/rounds/RoundFactory';

function buildRoundQuery(repo: RoundRepository, options: QueryOptions): Query {
  let q: Query = query(repo.collectionRef);
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

export function useRound(repo: RoundRepository | null, roundId: string) {
  const { data, isLoading, error } = useFirestoreDocument(repo ? repo.getDocumentRef(roundId) : null);
  return { round: data ? RoundFactory.createRound(data.type as RoundType, data) : null, loading: isLoading, error };
}

export function useRoundOnce(repo: RoundRepository | null, roundId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(roundId) : null);
  return { round: data ? RoundFactory.createRound(data.type as RoundType, data) : null, loading: isLoading, error };
}

export function useAllRounds(repo: RoundRepository | null) {
  const { data, isLoading, error } = useFirestoreCollection(repo ? query(repo.collectionRef) : null, [
    repo?.collectionRef.path ?? null,
  ]);
  return {
    rounds: data?.map((r) => RoundFactory.createRound(r.type as RoundType, r)) ?? [],
    loading: isLoading,
    error,
  };
}

export function useAllRoundsOnce(repo: RoundRepository | null, queryOptions: QueryOptions = {}) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(repo ? buildRoundQuery(repo, queryOptions) : null, [
    repo?.collectionRef.path ?? null,
    ...queryOptionsKey(queryOptions),
  ]);
  return {
    rounds: data?.map((r) => RoundFactory.createRound(r.type as RoundType, r)) ?? [],
    loading: isLoading,
    error,
  };
}
