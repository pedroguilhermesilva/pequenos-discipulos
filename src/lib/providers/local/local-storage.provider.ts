import { mkdir, unlink, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import type { StorageProvider } from '@/lib/providers/interfaces/storage.provider';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

export class LocalStorageProvider implements StorageProvider {
  async save(relativePath: string, data: Buffer, _contentType?: string): Promise<string> {
    const absolute = path.join(STORAGE_ROOT, relativePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, data);
    return relativePath;
  }

  getPublicUrl(relativePath: string): string {
    return `/api/storage/${relativePath.split(path.sep).join('/')}`;
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await access(path.join(STORAGE_ROOT, relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async delete(relativePath: string): Promise<void> {
    try {
      await unlink(path.join(STORAGE_ROOT, relativePath));
    } catch {
      // ignore missing files
    }
  }
}
