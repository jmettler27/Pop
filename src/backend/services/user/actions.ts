'use server';

import UserService from '@/backend/services/user/UserService';

/**
 * Returns the public display fields (name, avatar) for the given user ids.
 * The client uses this instead of reading `users/**` from Firestore directly.
 */
export const getPublicUsersByIds = async (userIds: string[]) => {
  return UserService.getPublicUsersByIds(userIds);
};
