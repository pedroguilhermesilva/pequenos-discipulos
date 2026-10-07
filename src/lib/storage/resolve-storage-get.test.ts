import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveStorageGet } from '@/lib/storage/resolve-storage-get';

describe('resolveStorageGet', () => {
  const storageAccess = { userCanReadAudioPath: vi.fn() };
  const storage = { read: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const result = await resolveStorageGet({
      pathSegments: ['audio', 'adapt-1', 'file.mp3'],
      userId: null,
      storageAccess: storageAccess as never,
      storage: storage as never,
    });

    expect(result.status).toBe(401);
  });

  it('returns 404 when user lacks access (IDOR)', async () => {
    vi.mocked(storageAccess.userCanReadAudioPath).mockResolvedValue(false);

    const result = await resolveStorageGet({
      pathSegments: ['audio', 'adapt-1', 'file.mp3'],
      userId: 'user-a',
      storageAccess: storageAccess as never,
      storage: storage as never,
    });

    expect(result.status).toBe(404);
    expect(storage.read).not.toHaveBeenCalled();
  });

  it('streams the file with private cache headers when authorized', async () => {
    vi.mocked(storageAccess.userCanReadAudioPath).mockResolvedValue(true);
    vi.mocked(storage.read).mockResolvedValue({
      stream: new ReadableStream(),
      contentType: 'audio/mpeg',
    });

    const result = await resolveStorageGet({
      pathSegments: ['audio', 'adapt-1', 'file.mp3'],
      userId: 'user-a',
      storageAccess: storageAccess as never,
      storage: storage as never,
    });

    expect(result.status).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('audio/mpeg');
    expect(result.headers?.['Cache-Control']).toBe('private, no-store');
    expect(result.stream).toBeDefined();
  });
});
