import { describe, expect, it } from 'vitest';
import { buildStoryUrl, parseStorySearchParams, parsedStorySearchParamsFromRecord } from '@/lib/stories/story-url';

describe('story-url', () => {
  it('keeps /stories/nova and adds historia query param after generation', () => {
    const url = buildStoryUrl('nova', {
      passageId: 'mateus-2-1-3',
      contentType: 'audio',
      ready: true,
      historiaId: 'story-123',
      verseFrom: 1,
      verseTo: 3,
    });

    expect(url).toMatch(/^\/stories\/nova\?/);
    expect(url).toContain('historia=story-123');
    expect(url).toContain('pronto=1');
  });

  it('parses historia id from search params', () => {
    const parsed = parsedStorySearchParamsFromRecord({
      passagem: 'mateus-2-1-3',
      tipo: 'text',
      pronto: '1',
      historia: 'story-123',
    });

    expect(parsed.historiaId).toBe('story-123');
    expect(parsed.ready).toBe(true);
    expect(parseStorySearchParams(new URLSearchParams('historia=abc')).historiaId).toBe('abc');
  });
});
