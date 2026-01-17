import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/backend/firebase/firebase';
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore';

import { getDocDataTransaction } from '@/backend/services/utils';
import { isArray } from '@/backend/utils/arrays';

export default class FirebaseDocumentRepository {
  /**
   * @param {string|string[]} documentPath - The path to the document
   */
  constructor(documentPath) {
    // documentPath can be either a string or an array of strings
    this.docRef = isArray(documentPath) ? doc(firestore, ...documentPath) : doc(firestore, documentPath);
  }

  // Firestore operations
  /**
   * Get a document by ID or path
   * @returns {Promise<Object>} The document data with ID
   */
  async get() {
    const docSnap = await getDoc(this.docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  /**
   * Get a document by ID or path within a transaction
   * @param {Transaction} transaction - The transaction
   * @returns {Promise<Object>} The document data with ID
   */
  async getTransaction(transaction) {
    return getDocDataTransaction(transaction, this.docRef);
  }

  /**
   * Update a document by ID or path
   * @param {Object} data - The data to update
   * @returns {Promise<Object>} The updated document data with ID
   */
  async update(data) {
    await updateDoc(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  /**
   * Update a document by ID or path within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {Object} data - The data to update
   * @returns {Promise<Object>} The updated document data with ID
   */
  async updateTransaction(transaction, data) {
    await transaction.update(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  /**
   * Set a document by ID or path
   * @param {Object} data - The data to set
   * @returns {Promise<Object>} The set document data with ID
   */
  async set(data) {
    await setDoc(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  /**
   * Set a document by ID or path within a transaction
   * @param {Transaction} transaction - The transaction
   * @param {Object} data - The data to set
   * @returns {Promise<Object>} The set document data with ID
   */
  async setTransaction(transaction, data) {
    await transaction.set(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  async create(data) {
    const newDocRef = await addDoc(this.docRef, data);
    return { id: newDocRef.id, ...data };
  }

  async createTransaction(transaction, data) {
    await transaction.set(this.docRef, data);
    return { id: this.docRef.id, ...data };
  }

  /**
   * Delete a document by ID or path
   * @returns {Promise<void>}
   */
  async delete() {
    await deleteDoc(this.docRef);
  }

  /**
   * Delete a document by ID or path within a transaction
   * @param {Transaction} transaction - The transaction
   * @returns {Promise<void>}
   */
  async deleteTransaction(transaction) {
    await transaction.delete(this.docRef);
  }

  // React hooks
  useDocument() {
    const [data, loading, error] = useDocumentData(this.docRef);
    return {
      data: data ? { id: this.docRef.id, ...data } : null,
      loading,
      error,
    };
  }

  useDocumentOnce() {
    const [data, loading, error] = useDocumentDataOnce(this.docRef);
    return {
      data: data ? { id: this.docRef.id, ...data } : null,
      loading,
      error,
    };
  }
}
