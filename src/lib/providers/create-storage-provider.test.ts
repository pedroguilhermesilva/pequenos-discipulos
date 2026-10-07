import { afterEach, describe, expect, it, vi } from 'vitest';

describe('createStorageProvider', () => {
  afterEach(() => {
    vi.resetModules();
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it('uses BlobStorageProvider when BLOB_READ_WRITE_TOKEN is set', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token';
    const { createStorageProvider } = await import('@/lib/providers/create-storage-provider');
    const { BlobStorageProvider } = await import('@/lib/providers/vercel/blob-storage.provider');

    expect(createStorageProvider()).toBeInstanceOf(BlobStorageProvider);
  });

  it('falls back to LocalStorageProvider without token', async () => {
    const { createStorageProvider } = await import('@/lib/providers/create-storage-provider');
    const { LocalStorageProvider } = await import('@/lib/providers/local/local-storage.provider');

    expect(createStorageProvider()).toBeInstanceOf(LocalStorageProvider);
  });
});
