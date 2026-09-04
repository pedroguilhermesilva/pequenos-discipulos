import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BIBLE_VERSION_ID,
  getBibleVersionLabel,
  resolveYouVersionBibleId,
} from '@/lib/stories/bible-versions';

describe('bible-versions', () => {
  it('maps legacy placeholder ids to the licensed YouVersion id', () => {
    expect(resolveYouVersionBibleId('211')).toBe(DEFAULT_BIBLE_VERSION_ID);
    expect(resolveYouVersionBibleId('129')).toBe(DEFAULT_BIBLE_VERSION_ID);
    expect(resolveYouVersionBibleId('1608')).toBe(DEFAULT_BIBLE_VERSION_ID);
  });

  it('keeps the current default id unchanged', () => {
    expect(resolveYouVersionBibleId(DEFAULT_BIBLE_VERSION_ID)).toBe(DEFAULT_BIBLE_VERSION_ID);
  });

  it('labels the default bible version', () => {
    expect(getBibleVersionLabel(DEFAULT_BIBLE_VERSION_ID)).toContain('BLT');
  });
});
