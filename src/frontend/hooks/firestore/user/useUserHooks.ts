import { collection, doc, query } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';
import { useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import User, { type UserData } from '@/models/users/user';

const USERS_REF = collection(firestore, 'users');

export function useUser(id: string) {
  const { data, isLoading, error } = useFirestoreDocument(doc(USERS_REF, id));
  return { user: data ? new User(data as unknown as UserData) : null, loading: isLoading, error };
}

export function useUserOnce(id: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(doc(USERS_REF, id));
  return { user: data ? new User(data as unknown as UserData) : null, loading: isLoading, error };
}

export function useAllUsersOnce() {
  const { data, isLoading, error } = useFirestoreCollectionOnce(query(USERS_REF), ['users']);
  return { users: data?.map((u) => new User(u as unknown as UserData)) ?? [], loading: isLoading, error };
}
