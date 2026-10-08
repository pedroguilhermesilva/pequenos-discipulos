import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchChapterVerses = vi.fn();

vi.mock('@/lib/bible/fetch-chapter-text', () => ({
  fetchChapterVerses: (...args: unknown[]) => fetchChapterVerses(...args),
  clearBibliasBookJsonCache: vi.fn(),
}));

import { BibleTextService } from './bible-text.service';

const prisma = {
  passage: {
    update: vi.fn(),
  },
};

describe('BibleTextService', () => {
  beforeEach(() => {
    fetchChapterVerses.mockReset();
    prisma.passage.update.mockReset();
    prisma.passage.update.mockResolvedValue({});
  });

  it('returns cached verses without fetching when sourceText already has them', async () => {
    const service = new BibleTextService(prisma as never);
    const sourceText = {
      reference: 'Atos 2',
      bibleVersionId: 'alm1911',
      chapter: 2,
      verses: ['Primeiro.', 'Segundo.', 'Terceiro.'],
    };

    const result = await service.resolvePassageVerses({
      passage: { id: 'passage-1', slug: 'atos-2', sourceText },
      verseFrom: 1,
      verseTo: 2,
      bibleVersionId: 'alm1911',
    });

    expect(result.verses).toEqual([
      { number: 1, text: 'Primeiro.' },
      { number: 2, text: 'Segundo.' },
    ]);
    expect(fetchChapterVerses).not.toHaveBeenCalled();
    expect(prisma.passage.update).not.toHaveBeenCalled();
  });

  it('fetches chapter text, persists it, and returns the requested range', async () => {
    fetchChapterVerses.mockResolvedValue([
      'Versículo 1.',
      'Versículo 2.',
      'Versículo 3.',
    ]);

    const service = new BibleTextService(prisma as never);
    const result = await service.resolvePassageVerses({
      passage: {
        id: 'passage-1',
        slug: 'atos-2',
        sourceText: { reference: 'Atos 2' },
      },
      verseFrom: 1,
      verseTo: 2,
      bibleVersionId: 'alm1911',
    });

    expect(result.error).toBeUndefined();
    expect(result.verses).toEqual([
      { number: 1, text: 'Versículo 1.' },
      { number: 2, text: 'Versículo 2.' },
    ]);
    expect(prisma.passage.update).toHaveBeenCalledWith({
      where: { id: 'passage-1' },
      data: {
        sourceText: expect.objectContaining({
          reference: 'Atos 2',
          bibleVersionId: 'alm1911',
          chapter: 2,
          verses: ['Versículo 1.', 'Versículo 2.', 'Versículo 3.'],
        }),
      },
    });
  });

  it('returns a friendly error when the remote source fails', async () => {
    const { BibleTextFetchError } = await import('@/lib/domain/errors');
    fetchChapterVerses.mockRejectedValue(
      new BibleTextFetchError('Não foi possível obter o texto bíblico para esta passagem.')
    );

    const service = new BibleTextService(prisma as never);
    const result = await service.resolvePassageVerses({
      passage: {
        id: 'passage-1',
        slug: 'atos-2',
        sourceText: { reference: 'Atos 2' },
      },
      verseFrom: 1,
      verseTo: 47,
      bibleVersionId: 'alm1911',
    });

    expect(result.verses).toEqual([]);
    expect(result.error).toMatch(/Não foi possível obter o texto bíblico/);
    expect(prisma.passage.update).not.toHaveBeenCalled();
  });
});
