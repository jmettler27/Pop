import { collection } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';

export const USERS_COLLECTION_REF = collection(firestore, 'users');
export const QUESTIONS_COLLECTION_REF = collection(firestore, 'questions');
export const GAMES_COLLECTION_REF = collection(firestore, 'games');
