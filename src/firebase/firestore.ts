import { collection } from 'firebase/firestore';

import { firestore } from '@/firebase/client';

// No `users` or `questions` collection ref: the client must not read `users/**` or
// `questions/**` directly (production Firestore rules deny it). Those go through the
// Go API (`@/api` — `getUsers` / `getPlayableQuestion` / `getEditableQuestions`).
export const GAMES_COLLECTION_REF = collection(firestore, 'games');
