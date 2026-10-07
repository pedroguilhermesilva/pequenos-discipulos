import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageAccessService } from '@/lib/services/storage-access.service';

describe('StorageAccessService', () => {
  const prisma = {
    audioAsset: { findFirst: vi.fn() },
    userStory: { findFirst: vi.fn() },
    passageAdaptation: { findUnique: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildService() {
    return new StorageAccessService(prisma as never);
  }

  const audioPath = 'audio/adapt-1/p0-par0-part0.mp3';

  it('allows access when the user owns a UserStory for the adaptation', async () => {
    vi.mocked(prisma.audioAsset.findFirst).mockResolvedValue({ id: 'asset-1' } as never);
    vi.mocked(prisma.userStory.findFirst).mockResolvedValue({ id: 'story-1' } as never);

    const allowed = await buildService().userCanReadAudioPath('user-a', audioPath);

    expect(allowed).toBe(true);
    expect(prisma.passageAdaptation.findUnique).not.toHaveBeenCalled();
  });

  it('allows access when the user created the adaptation', async () => {
    vi.mocked(prisma.audioAsset.findFirst).mockResolvedValue({ id: 'asset-1' } as never);
    vi.mocked(prisma.userStory.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.passageAdaptation.findUnique).mockResolvedValue({
      createdByUserId: 'user-a',
    } as never);

    expect(await buildService().userCanReadAudioPath('user-a', audioPath)).toBe(true);
  });

  it('denies access to another family adaptation (IDOR)', async () => {
    vi.mocked(prisma.audioAsset.findFirst).mockResolvedValue({ id: 'asset-1' } as never);
    vi.mocked(prisma.userStory.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.passageAdaptation.findUnique).mockResolvedValue({
      createdByUserId: 'user-b',
    } as never);

    expect(await buildService().userCanReadAudioPath('user-a', audioPath)).toBe(false);
  });

  it('denies access when the audio asset is not registered for the path', async () => {
    vi.mocked(prisma.audioAsset.findFirst).mockResolvedValue(null);

    expect(await buildService().userCanReadAudioPath('user-a', audioPath)).toBe(false);
    expect(prisma.userStory.findFirst).not.toHaveBeenCalled();
  });

  it('denies non-audio paths', async () => {
    expect(await buildService().userCanReadAudioPath('user-a', 'other/file.mp3')).toBe(false);
  });
});
