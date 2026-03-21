import { ref } from 'firebase/database';

import { database } from '@/backend/firebase/firebase';

export const SERVER_TIME_OFFSET_REF = ref(database, '.info/serverTimeOffset');
