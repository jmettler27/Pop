import { randomUUID } from 'crypto';

import { adminStorageBucket } from '@/firebase/admin';
import { isArray } from '@/utils/arrays';

// Host for the manually-built Firebase download URL. Matches what the client SDK's
// `getDownloadURL()` returned: the emulator serves the same `/v0/b/{bucket}/o/...`
// download API on its own host.
const STORAGE_DOWNLOAD_HOST =
  process.env.NEXT_PUBLIC_USE_EMULATORS === 'true' ? 'http://127.0.0.1:9199' : 'https://firebasestorage.googleapis.com';

export default class StorageRepository {
  protected basePath: string;

  constructor(basePath: string | string[]) {
    this.basePath = isArray(basePath) ? (basePath as string[]).join('/') : (basePath as string);
  }

  protected getFullPath(path: string): string {
    return `${this.basePath}/${path}`;
  }

  async uploadFile(file: File, path: string): Promise<string> {
    const fullPath = this.getFullPath(path);
    const buffer = Buffer.from(await file.arrayBuffer());
    const token = randomUUID();
    const bucket = adminStorageBucket();

    await bucket.file(fullPath).save(buffer, {
      contentType: file.type || 'application/octet-stream',
      // Nested: object metadata → custom metadata. `firebaseStorageDownloadTokens`
      // is what the `?token=` download URL validates against.
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });

    return `${STORAGE_DOWNLOAD_HOST}/v0/b/${bucket.name}/o/${encodeURIComponent(fullPath)}?alt=media&token=${token}`;
  }
}
