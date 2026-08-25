import { ref } from 'firebase/database';

import { database } from '@/firebase/firebase';

export const SERVER_TIME_OFFSET_REF = ref(database, '.info/serverTimeOffset');
