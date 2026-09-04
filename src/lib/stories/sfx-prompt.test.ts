import { describe, expect, it } from 'vitest';
import { buildSfxPrompt } from '@/lib/stories/sfx-prompt';

describe('buildSfxPrompt', () => {
  it('prefers explicit sfxPrompt from content', () => {
    expect(buildSfxPrompt('Som da estrela', 'gentle star twinkle')).toBe(
      'gentle star twinkle'
    );
  });

  it('maps known Portuguese labels to English prompts', () => {
    expect(buildSfxPrompt('Brilho da estrela guia')).toContain('star');
    expect(buildSfxPrompt('chuva')).toContain('rain');
    expect(buildSfxPrompt('raio')).toContain('thunder');
    expect(buildSfxPrompt('plim, plim!')).toContain('twinkle');
  });

  it('falls back to a generic child-friendly prompt', () => {
    expect(buildSfxPrompt('Som misterioso')).toContain('Som misterioso');
  });
});
