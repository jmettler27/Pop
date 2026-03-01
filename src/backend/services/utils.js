'use server';

import { firestore } from '@/backend/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const getDocDataTransaction = async (transaction, docRef) => {
  const docSnap = await transaction.get(docRef);
  return docSnap.data();
};

// READ
// Get document data
export async function getDocData(...docPath) {
  try {
    const docRef = doc(firestore, ...docPath);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.data();
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}
