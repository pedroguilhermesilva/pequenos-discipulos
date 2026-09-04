import { describe, expect, it } from 'vitest';
import type { AdaptationContent } from '@/lib/domain/schemas';
import {
  extractPagePlainText,
  extractStoryNarrationText,
} from '@/lib/stories/page-plain-text';
import {
  alignmentToWords,
  findActiveWordIndex,
  sliceAlignmentByCharRange,
  sliceStoryAlignment,
} from '@/lib/stories/narration-alignment';

function alignmentFromText(text: string, charDuration = 0.08) {
  const characters = [...text];
  return {
    characters,
    characterStartTimesSeconds: characters.map((_, index) => index * charDuration),
    characterEndTimesSeconds: characters.map((_, index) => (index + 1) * charDuration),
  };
}

describe('extractPagePlainText', () => {
  it('flattens structured page content into narration text', () => {
    const text = extractPagePlainText(
      {
        pages: [
          {
            paragraphs: [
              [
                { type: 'text', value: 'Era uma vez ' },
                { type: 'word', value: 'Deus' },
                { type: 'text', value: ' no céu.' },
              ],
            ],
          },
        ],
      },
      0
    );

    expect(text).toBe('Era uma vez Deus no céu.');
  });

  it('keeps punctuation attached and skips sound-effect cues', () => {
    const text = extractPagePlainText(
      {
        pages: [
          {
            paragraphs: [
              [
                { type: 'text', value: 'luz.' },
                { type: 'word', value: 'Jesus' },
                { type: 'text', value: '.' },
                { type: 'interactive', rotulo: 'Som de folhas', textoParaAudio: 'folhas', tagSom: 'folhas_suaves' },
                { type: 'audio-pill', label: 'Som de folhas', variant: 'efeito' },
                { type: 'text', value: 'Ele escreveu uma carta' },
              ],
            ],
          },
        ],
      },
      0
    );

    expect(text).toBe('luz. Jesus. Ele escreveu uma carta');
    expect(text).not.toContain('Som de folhas');
  });

  it('separates glued word parts and drops sound-effect pills', () => {
    const text = extractPagePlainText(
      {
        pages: [
          {
            paragraphs: [
              [
                {
                  type: 'text',
                  value:
                    'Era uma vez, Paulo, um amigo de Jesus, que queria contar a todos sobre a boa nova, que traz alegria e luz.',
                },
                {
                  type: 'word',
                  value: 'Jesus',
                  variant: 'vida',
                },
                {
                  type: 'text',
                  value:
                    'Ele escreveu uma carta, cheia de amor e verdade, para os gálatas, com muito carinho e humildade.',
                },
                {
                  type: 'audio-pill',
                  label: 'Som de folhas',
                  variant: 'efeito',
                },
              ],
            ],
          },
        ],
      },
      0
    );

    expect(text).toContain('luz. Jesus Ele escreveu');
    expect(text.endsWith('humildade.')).toBe(true);
    expect(text).not.toContain('Som de folhas');
    expect(text).not.toContain('luz.Jesus');
  });

  it('includes spoken interactive dialogue', () => {
    const text = extractPagePlainText(
      {
        pages: [
          {
            paragraphs: [
              [
                { type: 'text', value: 'Paulo disse:' },
                {
                  type: 'interactive',
                  rotulo: 'Paulo',
                  textoParaAudio: 'A graça de Jesus',
                  tagSom: 'fala_paulo',
                },
              ],
            ],
          },
        ],
      },
      0
    );

    expect(text).toBe('Paulo disse: A graça de Jesus');
  });
});

describe('extractStoryNarrationText', () => {
  it('concatenates pages and records character ranges', () => {
    const content: AdaptationContent = {
      pages: [
        { paragraphs: [[{ type: 'text', value: 'Página um.' }]] },
        { paragraphs: [[{ type: 'text', value: 'Página dois.' }]] },
      ],
    };

    const story = extractStoryNarrationText(content);

    expect(story.fullText).toBe('Página um. Página dois.');
    expect(story.pages).toEqual([
      { pageIndex: 0, text: 'Página um.', charStart: 0, charEnd: 10 },
      { pageIndex: 1, text: 'Página dois.', charStart: 11, charEnd: 23 },
    ]);
  });
});

describe('narration alignment helpers', () => {
  it('groups characters into words with timing', () => {
    const words = alignmentToWords({
      characters: ['O', 'l', 'á', ' ', 'D', 'e', 'u', 's'],
      characterStartTimesSeconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
      characterEndTimesSeconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
    });

    expect(words).toHaveLength(2);
    expect(words[0]?.text).toBe('Olá');
    expect(words[1]?.text).toBe('Deus');
  });

  it('finds the active word for the current playback time', () => {
    const words = alignmentToWords({
      characters: ['A', ' ', 'B'],
      characterStartTimesSeconds: [0, 0.2, 0.3],
      characterEndTimesSeconds: [0.2, 0.3, 0.5],
    });

    expect(findActiveWordIndex(words, 0.35)).toBe(1);
  });

  it('slices alignment by character range without shifting timestamps', () => {
    const alignment = alignmentFromText('Página um. Página dois.');
    const sliced = sliceAlignmentByCharRange(alignment, 11, 23);

    expect(sliced?.alignment.characters.join('')).toBe('Página dois.');
    expect(sliced?.startSeconds).toBe(11 * 0.08);
    expect(sliced?.endSeconds).toBe(23 * 0.08);
  });

  it('cuts a full-story alignment into contiguous page slices', () => {
    const story = extractStoryNarrationText({
      pages: [
        { paragraphs: [[{ type: 'text', value: 'Página um.' }]] },
        { paragraphs: [[{ type: 'text', value: 'Página dois.' }]] },
      ],
    });
    const slices = sliceStoryAlignment(alignmentFromText(story.fullText), story.pages);

    expect(slices).toHaveLength(2);
    expect(slices[0]?.pageIndex).toBe(0);
    expect(slices[1]?.startSeconds).toBe(slices[0]?.endSeconds);
  });
});
