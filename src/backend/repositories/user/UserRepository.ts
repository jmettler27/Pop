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
}
