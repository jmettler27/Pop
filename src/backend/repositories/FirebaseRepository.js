import { IRepository } from '@/backend/repositories/IRepository';
import { isArray } from '@/backend/utils/arrays';

import { firestore } from '@/backend/firebase/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  writeBatch,
} from 'firebase/firestore';

import { useDocumentData, useCollection, useCollectionOnce, useDocumentDataOnce } from 'react-firebase-hooks/firestore';

export default class FirebaseRepository extends IRepository {
  /**
   * @param {string|string[]} collectionPath - The path to the collection
   */
  constructor(collectionPath) {
    super();
    if (isArray(collectionPath)) {
      const invalidSegmentIndex = collectionPath.findIndex(
        (segment) => typeof segment !== 'string' || segment.trim().length === 0
      );
      if (invalidSegmentIndex !== -1) {
        throw new Error(
          `Invalid Firestore path segment at index ${invalidSegmentIndex}: ${String(collectionPath[invalidSegmentIndex])}`
        );
      }
    }
    // collectionPath can be either a string or an array of strings
    this.collectionRef = isArray(collectionPath)
      ? collection(firestore, ...collectionPath)
      : collection(firestore, collectionPath);
  }

  /**
   * Get a document reference by ID or path
   * @private
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @returns {DocumentReference} The document reference
   */
  getDocumentRef(idOrPath) {
    if (isArray(idOrPath)) {
      if (idOrPath.length === 0) {
        throw new Error('Path must be a non-empty array of path segments');
      }
      return doc(this.collectionRef, ...idOrPath);
    }
    return doc(this.collectionRef, idOrPath);
  }

  /**
   * Get a document by ID or path
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @returns {Promise<Object>} The document data with ID
   */
  async get(idOrPath) {
    const docRef = this.getDocumentRef(idOrPath);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  /**
   * Get a document by ID or path within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @returns {Promise<Object>} The document data with ID
   */
  async getTransaction(transaction, idOrPath) {
    const docRef = this.getDocumentRef(idOrPath);
    const docSnap = await transaction.get(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async getNumDocuments(transaction) {
    const querySnapshot = await transaction.get(query(this.collectionRef));
    return querySnapshot.docs.length;
  }

  async getAll() {
    const q = query(this.collectionRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // async getAll() {
  //   const q = query(this.collectionRef);
  //   // Fallback for environments where transaction query reads are unstable.
  //   const querySnapshot = await getDocs(q);
  //   return querySnapshot.docs.map((doc) => ({
  //     id: doc.id,
  //     ...doc.data(),
  //   }));
  // }

  async getByQuery(queryOptions = {}) {
    let q = query(this.collectionRef);
    if (queryOptions.where) {
      q = query(q, where(queryOptions.where.field, queryOptions.where.operator, queryOptions.where.value));
    }
    if (queryOptions.orderBy) {
      q = query(q, orderBy(queryOptions.orderBy.field, queryOptions.orderBy.direction));
    }
    if (queryOptions.limit) {
      q = query(q, limit(queryOptions.limit));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getByQueryTransaction(transaction, queryOptions = {}) {
    let q = query(this.collectionRef);
    if (queryOptions.where) {
      q = query(q, where(queryOptions.where.field, queryOptions.where.operator, queryOptions.where.value));
    }
    if (queryOptions.orderBy) {
      q = query(q, orderBy(queryOptions.orderBy.field, queryOptions.orderBy.direction));
    }
    if (queryOptions.limit) {
      q = query(q, limit(queryOptions.limit));
    }
    const querySnapshot = await transaction.get(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getByField(field, value) {
    return this.getByQuery({ where: { field, operator: '==', value } });
  }

  async getByFieldTransaction(transaction, field, value) {
    return this.getByQueryTransaction(transaction, { where: { field, operator: '==', value } });
  }

  /**
   * Update a document by ID or path
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @param {Object} data - The data to update
   * @returns {Promise<Object>} The updated document data with ID
   */
  async update(idOrPath, data) {
    const docRef = this.getDocumentRef(idOrPath);
    await updateDoc(docRef, data);
    return { id: docRef.id, ...data };
  }

  /**
   * Update a document by ID or path within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @param {Object} data - The data to update
   * @returns {Promise<Object>} The updated document data with ID
   */
  async updateTransaction(transaction, idOrPath, data) {
    const docRef = this.getDocumentRef(idOrPath);
    await transaction.update(docRef, data);
    return { id: docRef.id, ...data };
  }

  async updateAll(data) {
    const querySnapshot = await getDocs(query(this.collectionRef));

    const batch = writeBatch(firestore);
    for (const doc of querySnapshot.docs) {
      batch.update(doc.ref, data);
    }
    await batch.commit();
  }

  /**
   * Set a document by ID or path
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @param {Object} data - The data to set
   * @returns {Promise<Object>} The set document data with ID
   */
  async set(idOrPath, data) {
    const docRef = this.getDocumentRef(idOrPath);
    await setDoc(docRef, data);
    return { id: docRef.id, ...data };
  }

  /**
   * Set a document by ID or path within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @param {Object} data - The data to set
   * @returns {Promise<Object>} The set document data with ID
   */
  async setTransaction(transaction, idOrPath, data) {
    const docRef = this.getDocumentRef(idOrPath);
    await transaction.set(docRef, data);
    return { id: docRef.id, ...data };
  }

  /**
   * Create a document by ID or path
   * @param {Object} data - The data to create
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @returns {Promise<Object>} The created document data with ID
   */
  async create(data, idOrPath = null) {
    const docRef = idOrPath ? this.getDocumentRef(idOrPath) : doc(this.collectionRef);
    const newDocRef = await addDoc(docRef, data);
    return { id: newDocRef.id, ...data };
  }

  /**
   * Create a document by ID or path within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {Object} data - The data to create
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @returns {Promise<Object>} The created document data with ID
   */
  async createTransaction(transaction, data, idOrPath = null) {
    console.log('createTransaction', data, idOrPath);
    const docRef = idOrPath ? this.getDocumentRef(idOrPath) : doc(this.collectionRef);
    await transaction.set(docRef, data);
    return { id: docRef.id, ...data };
  }

  /**
   * Delete a document by ID or path
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @returns {Promise<void>}
   */
  async delete(idOrPath) {
    const docRef = this.getDocumentRef(idOrPath);
    await deleteDoc(docRef);
  }

  /**
   * Delete a document by ID or path within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @returns {Promise<void>}
   */
  async deleteTransaction(transaction, idOrPath) {
    const docRef = this.getDocumentRef(idOrPath);
    await transaction.delete(docRef);
  }

  /**
   * React hook to get a document by ID or path
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @returns {Object} The document data with loading and error states
   */
  useDocument(idOrPath) {
    const docRef = this.getDocumentRef(idOrPath);
    const [data, loading, error] = useDocumentData(docRef);
    return {
      data: data ? { id: docRef.id, ...data } : null,
      loading,
      error,
    };
  }

  /**
   * React hook to get a document by ID or path once
   * @param {string|string[]} idOrPath - Document ID or array of path segments
   * @returns {Object} The document data with loading and error states
   */
  useDocumentOnce(idOrPath) {
    const docRef = this.getDocumentRef(idOrPath);
    const [data, loading, error] = useDocumentDataOnce(docRef);
    return {
      data: data ? { id: docRef.id, ...data } : null,
      loading,
      error,
    };
  }

  // React hooks for real-time operations
  useCollection(queryOptions = {}) {
    let q = query(this.collectionRef);

    // Apply query options
    if (queryOptions.where) {
      q = query(q, where(queryOptions.where.field, queryOptions.where.operator, queryOptions.where.value));
    }
    if (queryOptions.orderBy) {
      q = query(q, orderBy(queryOptions.orderBy.field, queryOptions.orderBy.direction));
    }
    if (queryOptions.limit) {
      q = query(q, limit(queryOptions.limit));
    }

    const [data, loading, error] = useCollection(q);
    return {
      data:
        data?.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) || [],
      loading,
      error,
    };
  }

  useCollectionOnce(queryOptions = {}) {
    let q = query(this.collectionRef);

    // Apply query options
    if (queryOptions.where) {
      q = query(q, where(queryOptions.where.field, queryOptions.where.operator, queryOptions.where.value));
    }
    if (queryOptions.orderBy) {
      q = query(q, orderBy(queryOptions.orderBy.field, queryOptions.orderBy.direction));
    }
    if (queryOptions.limit) {
      q = query(q, limit(queryOptions.limit));
    }

    const [data, loading, error] = useCollectionOnce(q);
    return {
      data:
        data?.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) || [],
      loading,
      error,
    };
  }

  useQuery(queryBuilder) {
    const q = queryBuilder(this.collectionRef);
    const [data, loading, error] = useCollection(q);
    return {
      data:
        data?.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) || [],
      loading,
      error,
    };
  }

  /**
   * Get a document from a deep path relative to this collection
   * @param {string[]} path - Array of path segments to the document
   * @returns {Promise<Object>} The document data with ID
   */
  async getDeepDocument(path) {
    if (!isArray(path) || path.length === 0) {
      throw new Error('Path must be a non-empty array of path segments');
    }

    const docRef = doc(this.collectionRef, ...path);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  }

  /**
   * Get a document from a deep path relative to this collection within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {string[]} path - Array of path segments to the document
   * @returns {Promise<Object>} The document data with ID
   */
  async getDeepDocumentTransaction(transaction, path) {
    if (!isArray(path) || path.length === 0) {
      throw new Error('Path must be a non-empty array of path segments');
    }

    const docRef = doc(this.collectionRef, ...path);
    const docSnap = await transaction.get(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  }

  /**
   * React hook to get a document from a deep path relative to this collection
   * @param {string[]} path - Array of path segments to the document
   * @returns {Object} The document data with loading and error states
   */
  useDeepDocument(path) {
    if (!isArray(path) || path.length === 0) {
      throw new Error('Path must be a non-empty array of path segments');
    }

    const docRef = doc(this.collectionRef, ...path);
    const [data, loading, error] = useDocumentData(docRef);

    return {
      data: data ? { id: docRef.id, ...data } : null,
      loading,
      error,
    };
  }

  /**
   * React hook to get a document from a deep path relative to this collection once
   * @param {string[]} path - Array of path segments to the document
   * @returns {Object} The document data with loading and error states
   */
  useDeepDocumentOnce(path) {
    if (!isArray(path) || path.length === 0) {
      throw new Error('Path must be a non-empty array of path segments');
    }

    const docRef = doc(this.collectionRef, ...path);
    const [data, loading, error] = useDocumentDataOnce(docRef);

    return {
      data: data ? { id: docRef.id, ...data } : null,
      loading,
      error,
    };
  }
}
