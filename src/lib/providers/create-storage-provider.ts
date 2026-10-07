import { LocalStorageProvider } from '@/lib/providers/local/local-storage.provider';
import type { StorageProvider } from '@/lib/providers/interfaces/storage.provider';
import { BlobStorageProvider } from '@/lib/providers/vercel/blob-storage.provider';

export function createStorageProvider(): StorageProvider {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    return new BlobStorageProvider({ token });
  }
  return new LocalStorageProvider();
}
