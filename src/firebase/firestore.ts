import { collection } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';

// No `users` collection ref: the client must not read `users/**` directly
// (production Firestore rules deny it). Use the `getPublicUsersByIds` server action.
export const QUESTIONS_COLLECTION_REF = collection(firestore, 'questions');
export const GAMES_COLLECTION_REF = collection(firestore, 'games');
