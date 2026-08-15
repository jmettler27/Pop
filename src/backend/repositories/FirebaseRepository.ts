import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Query,
  type Transaction,
  type WhereFilterOp,
} from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { IRepository } from '@/backend/repositories/IRepository';
import { isArray } from '@/backend/utils/arrays';

export interface QueryOptions {
  where?: { field: string; operator: WhereFilterOp; value: unknown };
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

export default class FirebaseRepository extends IRepository {
  public readonly collectionRef: CollectionReference<DocumentData>;

  constructor(collectionPath: string | string[]) {
    super();
    if (isArray(collectionPath)) {
      const path = collectionPath as string[];
      const invalidIdx = path.findIndex((s) => typeof s !== 'string' || s.trim().length === 0);
      if (invalidIdx !== -1) {
        throw new Error(`Invalid Firestore path segment at index ${invalidIdx}: ${String(path[invalidIdx])}`);
      }
      this.collectionRef = collection(firestore, path[0], ...path.slice(1));
    } else {
      this.collectionRef = collection(firestore, collectionPath as string);
    }
  }

  public getDocumentRef(idOrPath: string | string[]): DocumentReference {
    if (isArray(idOrPath)) {
      const path = idOrPath as string[];
      if (path.length === 0) throw new Error('Path must be a non-empty array of path segments');
      return doc(this.collectionRef, ...path);
    }
    return doc(this.collectionRef, idOrPath as string);
  }

  async get(idOrPath: string | string[]): Promise<Record<string, unknown> | null> {
    const docRef = this.getDocumentRef(idOrPath);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async getTransaction(transaction: Transaction, idOrPath: string | string[]): Promise<Record<string, unknown> | null> {
    const docRef = this.getDocumentRef(idOrPath);
    const docSnap = await transaction.get(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async getAll(): Promise<Array<Record<string, unknown>>> {
    const querySnapshot = await getDocs(query(this.collectionRef));
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getNumDocuments(): Promise<number> {
    return (await this.getAll()).length;
  }

  private buildQuery(queryOptions: QueryOptions): Query<DocumentData> {
    let q: Query<DocumentData> = query(this.collectionRef);
    if (queryOptions.where) {
      q = query(q, where(queryOptions.where.field, queryOptions.where.operator, queryOptions.where.value));
    }
    if (queryOptions.orderBy) {
      q = query(q, orderBy(queryOptions.orderBy.field, queryOptions.orderBy.direction));
    }
    if (queryOptions.limit) {
      q = query(q, limit(queryOptions.limit));
    }
    return q;
  }

  async getByQuery(queryOptions: QueryOptions = {}): Promise<Array<Record<string, unknown>>> {
    const querySnapshot = await getDocs(this.buildQuery(queryOptions));
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getByQueryTransaction(
    transaction: Transaction,
    queryOptions: QueryOptions = {}
  ): Promise<Array<Record<string, unknown>>> {
    // Note: Firestore client transactions don't support queries; falling back to getDocs
    const querySnapshot = await getDocs(this.buildQuery(queryOptions));
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getByField(field: string, value: unknown): Promise<Array<Record<string, unknown>>> {
    return this.getByQuery({ where: { field, operator: '==', value } });
  }

  async getByFieldTransaction(
    transaction: Transaction,
    field: string,
    value: unknown
  ): Promise<Array<Record<string, unknown>>> {
    return this.getByQueryTransaction(transaction, { where: { field, operator: '==', value } });
  }

  async update(idOrPath: string | string[], data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const docRef = this.getDocumentRef(idOrPath);
    await updateDoc(docRef, data);
    return { id: docRef.id, ...data };
  }

  async updateTransaction(
    transaction: Transaction,
    idOrPath: string | string[],
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const docRef = this.getDocumentRef(idOrPath);
    await transaction.update(docRef, data);
    return { id: docRef.id, ...data };
  }

  async updateAll(data: Record<string, unknown>): Promise<void> {
    const querySnapshot = await getDocs(query(this.collectionRef));
    const batch = writeBatch(firestore);
    for (const d of querySnapshot.docs) batch.update(d.ref, data);
    await batch.commit();
  }

  async set(idOrPath: string | string[], data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const docRef = this.getDocumentRef(idOrPath);
    await setDoc(docRef, data);
    return { id: docRef.id, ...data };
  }

  async setTransaction(
    transaction: Transaction,
    idOrPath: string | string[],
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const docRef = this.getDocumentRef(idOrPath);
    await transaction.set(docRef, data);
    return { id: docRef.id, ...data };
  }

  async create(
    data: Record<string, unknown>,
    idOrPath: string | string[] | null = null
  ): Promise<Record<string, unknown>> {
    if (idOrPath) {
      const docRef = this.getDocumentRef(idOrPath);
      await setDoc(docRef, data);
      return { id: docRef.id, ...data };
    }
    const newDocRef = await addDoc(this.collectionRef, data);
    return { id: newDocRef.id, ...data };
  }

  async createTransaction(
    transaction: Transaction,
    data: Record<string, unknown>,
    idOrPath: string | string[] | null = null
  ): Promise<Record<string, unknown>> {
    const docRef = idOrPath ? this.getDocumentRef(idOrPath) : doc(this.collectionRef);
    await transaction.set(docRef, data);
    return { id: docRef.id, ...data };
  }

  async delete(idOrPath: string | string[]): Promise<void> {
    await deleteDoc(this.getDocumentRef(idOrPath));
  }

  async deleteTransaction(transaction: Transaction, idOrPath: string | string[]): Promise<void> {
    await transaction.delete(this.getDocumentRef(idOrPath));
  }

  async getCount(queryBuilder: (ref: CollectionReference<DocumentData>) => Query<DocumentData>): Promise<number> {
    const snapshot = await getCountFromServer(queryBuilder(this.collectionRef));
    return snapshot.data().count;
  }
}
