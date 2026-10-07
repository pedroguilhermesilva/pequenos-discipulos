import { beforeEach, describe, expect, it, vi } from 'vitest';

const putMock = vi.fn();
const getMock = vi.fn();
const headMock = vi.fn();
const delMock = vi.fn();

vi.mock('@vercel/blob', () => ({
  put: (...args: unknown[]) => putMock(...args),
  get: (...args: unknown[]) => getMock(...args),
  head: (...args: unknown[]) => headMock(...args),
  del: (...args: unknown[]) => delMock(...args),
}));

import { BlobStorageProvider } from '@/lib/providers/vercel/blob-storage.provider';

describe('BlobStorageProvider', () => {
  const provider = new BlobStorageProvider({ token: 'test-token' });

  beforeEach(() => {
    vi.clearAllMocks();
    putMock.mockResolvedValue({ pathname: 'audio/a/file.mp3' });
    headMock.mockResolvedValue({ pathname: 'audio/a/file.mp3' });
    getMock.mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream(),
      blob: { contentType: 'audio/mpeg', size: 128 },
    });
    delMock.mockResolvedValue(undefined);
  });

  it('uploads with private access and returns the relative path', async () => {
    const saved = await provider.save('audio/adapt-1/block.mp3', Buffer.from('abc'), 'audio/mpeg');

    expect(saved).toBe('audio/adapt-1/block.mp3');
    expect(putMock).toHaveBeenCalledWith(
      'audio/adapt-1/block.mp3',
      expect.any(Buffer),
      expect.objectContaining({
        access: 'private',
        contentType: 'audio/mpeg',
        token: 'test-token',
        allowOverwrite: true,
      })
    );
  });

  it('returns app proxy URLs instead of private blob URLs', () => {
    expect(provider.getPublicUrl('audio/adapt-1/block.mp3')).toBe(
      '/api/storage/audio/adapt-1/block.mp3'
    );
  });

  it('reads private blobs through the SDK', async () => {
    const result = await provider.read('audio/adapt-1/block.mp3');

    expect(getMock).toHaveBeenCalledWith('audio/adapt-1/block.mp3', {
      access: 'private',
      token: 'test-token',
    });
    expect(result?.contentType).toBe('audio/mpeg');
  });
});
