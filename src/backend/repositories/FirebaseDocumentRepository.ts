import type { DocumentReference, Transaction } from 'firebase-admin/firestore';

import { adminDb } from '@/firebase/admin';
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
      this.docRef = adminDb().doc(path.join('/'));
    } else {
      this.docRef = adminDb().doc(documentPath as string);
    }
  }

  async get(): Promise<Record<string, unknown> | null> {
    const docSnap = await this.docRef.get();
    return docSnap.exists ? { id: docSnap.id, ...(docSnap.data() ?? {}) } : null;
  }

  async getTransaction(transaction: Transaction): Promise<Record<string, unknown> | undefined> {
    return getDocDataTransaction(transaction, this.docRef);
  }

  async update(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await this.docRef.update(data);
    return { id: this.docRef.id, ...data };
  }

  async updateTransaction(transaction: Transaction, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await transaction.update(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  async set(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await this.docRef.set(data);
    return { id: this.docRef.id, ...data };
  }

  async setTransaction(transaction: Transaction, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await transaction.set(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  async create(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Doc repositories address a single fixed document; "create" writes it.
    await this.docRef.set(data);
    return { id: this.docRef.id, ...data };
  }

  async createTransaction(transaction: Transaction, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await transaction.set(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  async delete(): Promise<void> {
    await this.docRef.delete();
  }

  async deleteTransaction(transaction: Transaction): Promise<void> {
    await transaction.delete(this.docRef);
  }
}
