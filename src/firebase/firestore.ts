import { collection } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';

// No `users` or `questions` collection ref: the client must not read `users/**` or
// `questions/**` directly (production Firestore rules deny it). Use the
// `getPublicUsersByIds` / `getPlayableQuestion` / `getEditableQuestion` server actions.
export const GAMES_COLLECTION_REF = collection(firestore, 'games');
