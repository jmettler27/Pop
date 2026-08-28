import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Query,
  Transaction,
  WhereFilterOp,
} from 'firebase-admin/firestore';

import { IRepository } from '@/backend/repositories/IRepository';
import { adminDb } from '@/firebase/admin';
import { isArray } from '@/utils/arrays';

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
      this.collectionRef = adminDb().collection(path.join('/'));
    } else {
      this.collectionRef = adminDb().collection(collectionPath as string);
    }
  }

  public getDocumentRef(idOrPath: string | string[]): DocumentReference {
    if (isArray(idOrPath)) {
      const path = idOrPath as string[];
      if (path.length === 0) throw new Error('Path must be a non-empty array of path segments');
      return this.collectionRef.doc(path.join('/'));
    }
    return this.collectionRef.doc(idOrPath as string);
  }

  async get(idOrPath: string | string[]): Promise<Record<string, unknown> | null> {
    const docRef = this.getDocumentRef(idOrPath);
    const docSnap = await docRef.get();
    return docSnap.exists ? { id: docSnap.id, ...(docSnap.data() ?? {}) } : null;
  }

  async getTransaction(transaction: Transaction, idOrPath: string | string[]): Promise<Record<string, unknown> | null> {
    const docRef = this.getDocumentRef(idOrPath);
    const docSnap = await transaction.get(docRef);
    return docSnap.exists ? { id: docSnap.id, ...(docSnap.data() ?? {}) } : null;
  }

  async getAll(): Promise<Array<Record<string, unknown>>> {
    const querySnapshot = await this.collectionRef.get();
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getNumDocuments(): Promise<number> {
    return (await this.getAll()).length;
  }

  private buildQuery(queryOptions: QueryOptions): Query<DocumentData> {
    let q: Query<DocumentData> = this.collectionRef;
    if (queryOptions.where) {
      q = q.where(queryOptions.where.field, queryOptions.where.operator, queryOptions.where.value);
    }
    if (queryOptions.orderBy) {
      q = q.orderBy(queryOptions.orderBy.field, queryOptions.orderBy.direction);
    }
    if (queryOptions.limit) {
      q = q.limit(queryOptions.limit);
    }
    return q;
  }

  async getByQuery(queryOptions: QueryOptions = {}): Promise<Array<Record<string, unknown>>> {
    const querySnapshot = await this.buildQuery(queryOptions).get();
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getByQueryTransaction(
    transaction: Transaction,
    queryOptions: QueryOptions = {}
  ): Promise<Array<Record<string, unknown>>> {
    // Admin `transaction.get()` accepts a Query, so this is a real transactional
    // read (reads must still precede all writes in the callback).
    const querySnapshot = await transaction.get(this.buildQuery(queryOptions));
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
    await docRef.update(data);
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
    const querySnapshot = await this.collectionRef.get();
    const batch = adminDb().batch();
    for (const d of querySnapshot.docs) batch.update(d.ref, data);
    await batch.commit();
  }

  async set(idOrPath: string | string[], data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const docRef = this.getDocumentRef(idOrPath);
    await docRef.set(data);
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
      await docRef.set(data);
      return { id: docRef.id, ...data };
    }
    const newDocRef = await this.collectionRef.add(data);
    return { id: newDocRef.id, ...data };
  }

  async createTransaction(
    transaction: Transaction,
    data: Record<string, unknown>,
    idOrPath: string | string[] | null = null
  ): Promise<Record<string, unknown>> {
    const docRef = idOrPath ? this.getDocumentRef(idOrPath) : this.collectionRef.doc();
    await transaction.set(docRef, data);
    return { id: docRef.id, ...data };
  }

  async delete(idOrPath: string | string[]): Promise<void> {
    await this.getDocumentRef(idOrPath).delete();
  }

  async deleteTransaction(transaction: Transaction, idOrPath: string | string[]): Promise<void> {
    await transaction.delete(this.getDocumentRef(idOrPath));
  }

  async getCount(queryBuilder: (ref: CollectionReference<DocumentData>) => Query<DocumentData>): Promise<number> {
    const snapshot = await queryBuilder(this.collectionRef).count().get();
    return snapshot.data().count;
  }
}
