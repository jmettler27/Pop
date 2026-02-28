import { storage } from '@/backend/firebase/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { isArray } from '@/backend/utils/arrays';

export default class StorageRepository {
  /**
   * @param {string|string[]} basePath - The base path for storage operations
   */
  constructor(basePath) {
    this.storage = storage;
    this.basePath = isArray(basePath) ? basePath.join('/') : basePath;
  }

  /**
   * Get the full path by combining base path with the given path
   * @private
   * @param {string} path - The path to combine with base path
   * @returns {string} The full path
   */
  getFullPath(path) {
    return `${this.basePath}/${path}`;
  }

  /**
   * Upload a file to the specified path
   * @param {File} file - The file to upload
   * @param {string} path - The storage path
   * @returns {Promise<string>} The download URL
   */
  async uploadFile(file, path) {
    const fullPath = this.getFullPath(path);
    const fileRef = ref(this.storage, fullPath);
    await uploadBytesResumable(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  /**
   * Get a reference to a storage path
   * @param {string} path - The storage path
   * @returns {import('firebase/storage').StorageReference}
   */
  getRef(path) {
    const fullPath = this.getFullPath(path);
    return ref(this.storage, fullPath);
  }
}
