import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  type DocumentReference,
  type Transaction,
} from 'firebase/firestore';
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { isArray } from '@/backend/utils/arrays';

export interface DocumentResult {
  data: Record<string, unknown> | null;
  loading: boolean;
  error: Error | undefined;
}

const getDocDataTransaction = async (
  transaction: Transaction,
  docRef: DocumentReference
): Promise<Record<string, unknown> | undefined> => {
  const docSnap = await transaction.get(docRef);
  return docSnap.data() as Record<string, unknown> | undefined;
};

export default class FirebaseDocumentRepository {
  protected docRef: DocumentReference;

  constructor(documentPath: string | string[]) {
    if (isArray(documentPath)) {
      const path = documentPath as string[];
      this.docRef = doc(firestore, path[0], ...path.slice(1));
    } else {
      this.docRef = doc(firestore, documentPath as string);
    }
  }

  async get(): Promise<Record<string, unknown> | null> {
    const docSnap = await getDoc(this.docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async getTransaction(transaction: Transaction): Promise<Record<string, unknown> | undefined> {
    return getDocDataTransaction(transaction, this.docRef);
  }

  async update(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await updateDoc(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  async updateTransaction(transaction: Transaction, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await transaction.update(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  async set(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await setDoc(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  async setTransaction(transaction: Transaction, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await transaction.set(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  async create(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const newDocRef = await addDoc(this.docRef as unknown as Parameters<typeof addDoc>[0], data);
    return { id: newDocRef.id, ...data };
  }

  async createTransaction(transaction: Transaction, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await transaction.set(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  async delete(): Promise<void> {
    await deleteDoc(this.docRef);
  }

  async deleteTransaction(transaction: Transaction): Promise<void> {
    await transaction.delete(this.docRef);
  }

  useDocument(): DocumentResult {
    const [data, loading, error] = useDocumentData(this.docRef);
    return { data: data ? { id: this.docRef.id, ...data } : null, loading, error };
  }

  useDocumentOnce(): DocumentResult {
    const [data, loading, error] = useDocumentDataOnce(this.docRef);
    return { data: data ? { id: this.docRef.id, ...data } : null, loading, error };
  }
}
