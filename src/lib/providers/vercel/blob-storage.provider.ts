import { del, get, head, put } from '@vercel/blob';
import type { StorageProvider, StorageReadResult } from '@/lib/providers/interfaces/storage.provider';

export type BlobStorageConfig = {
  token: string;
};

/**
 * Private Vercel Blob storage (store: pequenos-discipulos-audio, region fra1).
 * The store is bound to BLOB_READ_WRITE_TOKEN — never expose token or private blob URLs to clients.
 */
export class BlobStorageProvider implements StorageProvider {
  constructor(private readonly config: BlobStorageConfig) {}

  async save(relativePath: string, data: Buffer, contentType?: string): Promise<string> {
    await put(relativePath, data, {
      access: 'private',
      contentType,
      token: this.config.token,
      allowOverwrite: true,
    });
    return relativePath;
  }

  getPublicUrl(relativePath: string): string {
    return `/api/storage/${relativePath.replace(/\\/g, '/')}`;
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await head(relativePath, { token: this.config.token });
      return true;
    } catch {
      return false;
    }
  }

  async delete(relativePath: string): Promise<void> {
    await del(relativePath, { token: this.config.token });
  }

  async read(relativePath: string): Promise<StorageReadResult | null> {
    const result = await get(relativePath, {
      access: 'private',
      token: this.config.token,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    return {
      stream: result.stream,
      contentType: result.blob.contentType,
      contentLength: result.blob.size,
    };
  }
}
