import { database } from "@/lib/firebase/firebase"
import { ref } from 'firebase/database';

export const SERVER_TIME_OFFSET_REF = ref(database, ".info/serverTimeOffset");
