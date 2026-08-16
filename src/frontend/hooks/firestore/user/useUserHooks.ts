import { query } from 'firebase/firestore';

import type UserRepository from '@/backend/repositories/user/UserRepository';
import { useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import User, { type UserData } from '@/models/users/user';

export function useUser(repo: UserRepository | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocument(repo ? repo.getDocumentRef(id) : null);
  return { user: data ? new User(data as unknown as UserData) : null, loading: isLoading, error };
}

export function useUserOnce(repo: UserRepository | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(id) : null);
  return { user: data ? new User(data as unknown as UserData) : null, loading: isLoading, error };
}

export function useAllUsersOnce(repo: UserRepository | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(repo ? query(repo.collectionRef) : null, [
    repo?.collectionRef.path ?? null,
  ]);
  return { users: data?.map((u) => new User(u as unknown as UserData)) ?? [], loading: isLoading, error };
}
