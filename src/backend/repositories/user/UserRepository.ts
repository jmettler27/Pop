import { type Transaction } from 'firebase/firestore';

import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import User, { type UserData } from '@/models/users/user';

export default class UserRepository extends FirebaseRepository {
  constructor() {
    super(['users']);
  }

  async getUserTransaction(transaction: Transaction, userId: string): Promise<User | null> {
    const data = await super.getTransaction(transaction, userId);
    return data ? new User(data as unknown as UserData) : null;
  }

  useUser(id: string) {
    const { data, loading, error } = super.useDocument(id);
    return { user: data ? new User(data as unknown as UserData) : null, loading, error };
  }

  useUserOnce(id: string) {
    const { data, loading, error } = super.useDocumentOnce(id);
    return { user: data ? new User(data as unknown as UserData) : null, loading, error };
  }

  useAllUsersOnce() {
    const { data, loading, error } = super.useCollectionOnce();
    return { users: data.map((u) => new User(u as unknown as UserData)), loading, error };
  }
}
