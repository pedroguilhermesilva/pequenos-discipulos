import type { PrismaClient } from '@prisma/client';
import { parseAdaptationIdFromAudioPath } from '@/lib/storage/audio-storage-path';

export class StorageAccessService {
  constructor(private readonly prisma: PrismaClient) {}

  async userCanReadAudioPath(userId: string, relativePath: string): Promise<boolean> {
    const adaptationId = parseAdaptationIdFromAudioPath(relativePath);
    if (!adaptationId) return false;

    const normalizedPath = relativePath.replace(/\\/g, '/');

    const asset = await this.prisma.audioAsset.findFirst({
      where: { adaptationId, filePath: normalizedPath },
    });
    if (!asset) return false;

    const userStory = await this.prisma.userStory.findFirst({
      where: { userId, adaptationId },
    });
    if (userStory) return true;

    const adaptation = await this.prisma.passageAdaptation.findUnique({
      where: { id: adaptationId },
      select: { createdByUserId: true },
    });

    return adaptation?.createdByUserId === userId;
  }
}
