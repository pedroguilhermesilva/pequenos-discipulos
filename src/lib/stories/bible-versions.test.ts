import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BIBLE_VERSION_ID,
  getBibleVersionLabel,
  resolveBibleVersionId,
} from '@/lib/stories/bible-versions';

describe('bible-versions', () => {
  it('maps legacy ids to the local Almeida version', () => {
    expect(resolveBibleVersionId('211')).toBe(DEFAULT_BIBLE_VERSION_ID);
    expect(resolveBibleVersionId('3254')).toBe(DEFAULT_BIBLE_VERSION_ID);
    expect(resolveBibleVersionId(DEFAULT_BIBLE_VERSION_ID)).toBe(DEFAULT_BIBLE_VERSION_ID);
  });

  it('labels the embedded translation', () => {
    expect(getBibleVersionLabel(DEFAULT_BIBLE_VERSION_ID)).toContain('Almeida');
  });
});
