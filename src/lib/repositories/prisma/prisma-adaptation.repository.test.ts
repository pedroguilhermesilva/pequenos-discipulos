import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { PrismaAdaptationRepository } from '@/lib/repositories/prisma/prisma-adaptation.repository';

describe('PrismaAdaptationRepository', () => {
  it('finds seeded Mateus adaptation by cache key', async () => {
    const repo = new PrismaAdaptationRepository(prisma);
    const passage = await prisma.passage.findUnique({ where: { slug: 'mateus-2-1-3' } });
    expect(passage).not.toBeNull();

    const found = await repo.findByCacheKey({
      passageId: passage!.id,
      bibleVersionId: '211',
      verseFrom: 1,
      verseTo: 3,
      ageTier: 'TIER_3_5',
      languageStyle: 'rhymes',
      contentType: 'text',
    });

    expect(found?.title).toBe('A Estrela de Mateus');
  });
});
