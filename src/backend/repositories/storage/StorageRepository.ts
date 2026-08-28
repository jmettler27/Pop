import { getDownloadURL, ref, uploadBytesResumable, type StorageReference } from 'firebase/storage';

import { ensureBackendAuth } from '@/firebase/backend-auth';
import { storage } from '@/firebase/firebase';
import { isArray } from '@/utils/arrays';

export default class StorageRepository {
  protected basePath: string;

  constructor(basePath: string | string[]) {
    this.basePath = isArray(basePath) ? (basePath as string[]).join('/') : (basePath as string);
  }

  protected getFullPath(path: string): string {
    return `${this.basePath}/${path}`;
  }

  async uploadFile(file: File, path: string): Promise<string> {
    await ensureBackendAuth();
    const fullPath = this.getFullPath(path);
    const fileRef = ref(storage, fullPath);
    await uploadBytesResumable(fileRef, file);
    return getDownloadURL(fileRef);
  }

  getRef(path: string): StorageReference {
    return ref(storage, this.getFullPath(path));
  }
}
