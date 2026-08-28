import UserRepository from '@/backend/repositories/user/UserRepository';

/** The only user fields the client is allowed to see (names + avatars for display). */
export interface PublicUser {
  id: string;
  name: string;
  image: string | null;
}

export default class UserService {
  /**
   * Resolves a set of user ids to their public display fields. Replaces the client
   * reading `users/{id}` (or the whole `users` collection) directly — production
   * Firestore rules deny client reads of `users/**`.
   */
  static async getPublicUsersByIds(userIds: string[]): Promise<PublicUser[]> {
    const uniqueIds = [...new Set(userIds.filter((id): id is string => typeof id === 'string' && id.length > 0))];
    if (uniqueIds.length === 0) return [];

    const repo = new UserRepository();
    const docs = await Promise.all(uniqueIds.map((id) => repo.get(id)));

    return docs
      .filter((doc): doc is Record<string, unknown> => doc !== null)
      .map((doc) => ({
        id: doc.id as string,
        name: (doc.name as string | undefined) ?? '',
        image: (doc.image as string | null | undefined) ?? null,
      }));
  }
}
