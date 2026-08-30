import { ref } from 'firebase/database';

import { database } from '@/firebase/client';

export const SERVER_TIME_OFFSET_REF = ref(database, '.info/serverTimeOffset');
