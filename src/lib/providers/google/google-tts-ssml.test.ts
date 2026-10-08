import { describe, expect, it } from 'vitest';
import {
  buildSsmlWithWordMarks,
  escapeSsmlText,
  tokenizeNarrationWords,
} from '@/lib/providers/google/google-tts-ssml';

describe('escapeSsmlText', () => {
  it('escapes reserved SSML characters', () => {
    expect(escapeSsmlText(`"A & B" <tag> 'x'`)).toBe(
      '&quot;A &amp; B&quot; &lt;tag&gt; &apos;x&apos;'
    );
  });
});

describe('tokenizeNarrationWords', () => {
  it('matches whitespace splitting used by the player', () => {
    const text = 'Página um. Página dois.';
    const tokens = tokenizeNarrationWords(text);

    expect(tokens.map((token) => token.text)).toEqual(['Página', 'um.', 'Página', 'dois.']);
    expect(tokens[0]).toEqual({ text: 'Página', charStart: 0, charEnd: 6 });
    expect(tokens[2]).toEqual({ text: 'Página', charStart: 11, charEnd: 17 });
  });
});

describe('buildSsmlWithWordMarks', () => {
  it('inserts one mark per word and a trailing end mark', () => {
    const { ssml, words } = buildSsmlWithWordMarks('Olá Deus');

    expect(words).toHaveLength(2);
    expect(ssml).toBe(
      '<speak><mark name="w0"/>Olá <mark name="w1"/>Deus<mark name="end"/></speak>'
    );
  });

  it('escapes SSML inside words', () => {
    const { ssml } = buildSsmlWithWordMarks('A&B');

    expect(ssml).toContain('<mark name="w0"/>A&amp;B<mark name="end"/>');
  });
});
