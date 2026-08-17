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

import { firestore } from '@/backend/firebase/firebase';
import { isArray } from '@/utils/arrays';

const getDocDataTransaction = async (
  transaction: Transaction,
  docRef: DocumentReference
): Promise<Record<string, unknown> | undefined> => {
  const docSnap = await transaction.get(docRef);
  return docSnap.data() as Record<string, unknown> | undefined;
};

export default class FirebaseDocumentRepository {
  public readonly docRef: DocumentReference;

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
}
