import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommunityBrowseService } from '@/lib/services/community-browse.service';

describe('CommunityBrowseService', () => {
  const adaptations = { listCommunityBrowse: vi.fn() };
  const votes = { findByUserAndAdaptation: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildService() {
    return new CommunityBrowseService(adaptations as never, votes as never);
  }

  it('returns paginated community items with user vote and excludes own versions in query', async () => {
    vi.mocked(adaptations.listCommunityBrowse).mockResolvedValue([
      {
        id: 'adapt-1',
        title: 'A Estrela',
        verseFrom: 1,
        verseTo: 3,
        ageTier: 'TIER_3_5',
        voteScore: 4.8,
        voteCount: 5,
        status: 'community',
        contentType: 'text',
        content: { pages: [{ blocks: [{ text: 'Era uma vez…' }] }] },
        adaptationNote: null,
        createdByUserId: 'other-user',
        updatedAt: new Date('2026-10-01'),
        passage: {
          slug: 'mateus-2-1-3',
          reference: 'Mateus 2:1–3',
          book: 'Mateus',
          preview: 'Preview',
        },
      },
    ] as never);
    vi.mocked(votes.findByUserAndAdaptation).mockResolvedValue({ value: 1 } as never);

    const result = await buildService().listForUser('user-a', {
      sort: 'votes',
      page: 0,
      limit: 12,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.userVote).toBe(1);
    expect(result.items[0]?.excerpt).toContain('Era uma vez');
    expect(adaptations.listCommunityBrowse).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 13,
        excludeCreatedByUserId: 'user-a',
      })
    );
  });

  it('sets hasMore when repository returns extra row', async () => {
    vi.mocked(adaptations.listCommunityBrowse).mockResolvedValue(
      Array.from({ length: 3 }, (_, index) => ({
        id: `adapt-${index}`,
        title: 'T',
        verseFrom: 1,
        verseTo: 2,
        ageTier: 'TIER_3_5',
        voteScore: 1,
        voteCount: 0,
        status: 'community',
        contentType: 'text',
        content: {},
        createdByUserId: null,
        updatedAt: new Date(),
        passage: { slug: 's', reference: 'R', book: 'B', preview: null },
      })) as never
    );
    vi.mocked(votes.findByUserAndAdaptation).mockResolvedValue(null);

    const result = await buildService().listForUser('user-a', {
      sort: 'votes',
      page: 0,
      limit: 2,
    });

    expect(result.items).toHaveLength(2);
    expect(result.hasMore).toBe(true);
  });
});
