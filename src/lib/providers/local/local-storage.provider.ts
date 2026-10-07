import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { StorageProvider, StorageReadResult } from '@/lib/providers/interfaces/storage.provider';
import { contentTypeFromPath } from '@/lib/storage/content-type';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

export class LocalStorageProvider implements StorageProvider {
  async save(relativePath: string, data: Buffer, contentType?: string): Promise<string> {
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

  async read(relativePath: string): Promise<StorageReadResult | null> {
    const absolute = path.join(STORAGE_ROOT, relativePath);
    try {
      await access(absolute);
    } catch {
      return null;
    }

    const nodeStream = createReadStream(absolute);
    return {
      stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>,
      contentType: contentTypeFromPath(relativePath),
    };
  }
}
