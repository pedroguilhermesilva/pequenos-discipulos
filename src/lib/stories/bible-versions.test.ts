import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BIBLE_VERSION_ID,
  getBibleVersionIdVariants,
  resolveBibleVersionId,
} from '@/lib/stories/bible-versions';

describe('bible version aliases', () => {
  it('resolves legacy ids to the canonical local id', () => {
    expect(resolveBibleVersionId('3254')).toBe(DEFAULT_BIBLE_VERSION_ID);
  });

  it('returns all stored variants for cache lookup', () => {
    const variants = getBibleVersionIdVariants('3254');
    expect(variants).toContain(DEFAULT_BIBLE_VERSION_ID);
    expect(variants).toContain('3254');
  });
});
