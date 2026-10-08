import { describe, expect, it } from 'vitest';
import {
  buildInlineWordAriaLabel,
  capInteractionsPerPage,
  findWordSpan,
  sanitizeInlineMarkers,
  splitTextBlockWithMarkers,
} from '@/lib/llm/inline-interactive-markers';

describe('findWordSpan', () => {
  it('finds a word ignoring accents and case', () => {
    expect(findWordSpan('O VENTO soprava forte.', 'vento')).toEqual({ start: 2, end: 7 });
    expect(findWordSpan('Choveu água do céu.', 'agua')).toEqual({ start: 7, end: 11 });
  });

  it('returns null when the word is absent', () => {
    expect(findWordSpan('Jesus acalmou o mar.', 'vento')).toBeNull();
  });
});

describe('sanitizeInlineMarkers', () => {
  it('drops markers whose word is not in the text', () => {
    const result = sanitizeInlineMarkers('O mar estava calmo.', [
      { palavra: 'vento', texto_para_audio: 'Fuuuu!', tag_som: 'vento_tempestade_mar' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('drops markers with unknown sound tags', () => {
    const result = sanitizeInlineMarkers('O vento soprava.', [
      { palavra: 'vento', texto_para_audio: 'Fuuuu!', tag_som: 'som_inventado_xyz' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('keeps valid markers and drops overlapping ones', () => {
    const result = sanitizeInlineMarkers('O vento e o mar.', [
      { palavra: 'vento', texto_para_audio: 'Fuuuu!', tag_som: 'vento_tempestade_mar' },
      { palavra: 'vento e', texto_para_audio: 'Ops', tag_som: 'vento_tempestade_mar' },
      { palavra: 'mar', texto_para_audio: 'Splash', tag_som: 'som_mar_vermelho' },
    ]);
    expect(result.map((m) => m.palavra)).toEqual(['vento', 'mar']);
  });

  it('accepts fala_ tags for speech', () => {
    const result = sanitizeInlineMarkers('Ele disse: Coragem!', [
      { palavra: 'Coragem', texto_para_audio: 'Coragem, sou eu!', tag_som: 'fala_jesus_coragem' },
    ]);
    expect(result).toHaveLength(1);
  });
});

describe('splitTextBlockWithMarkers', () => {
  it('splits text into inline word parts', () => {
    const parts = splitTextBlockWithMarkers('O vento soprava forte.', [
      { palavra: 'vento', texto_para_audio: 'Fuuuu!', tag_som: 'vento_tempestade_mar' },
    ]);

    expect(parts.map((p) => p.type)).toEqual(['text', 'word', 'text']);
    expect(parts[1]).toMatchObject({
      type: 'word',
      value: 'vento',
      tagSom: 'vento_tempestade_mar',
      ariaLabel: 'Tocar som de vento',
    });
  });

  it('returns plain text when all markers are invalid', () => {
    const parts = splitTextBlockWithMarkers('O mar estava calmo.', [
      { palavra: 'vento', texto_para_audio: 'Fuuuu!', tag_som: 'vento_tempestade_mar' },
    ]);
    expect(parts).toEqual([{ type: 'text', value: 'O mar estava calmo.' }]);
  });
});

describe('capInteractionsPerPage', () => {
  it('converts excess interactive words back to plain text', () => {
    const parts = capInteractionsPerPage([
      { type: 'text', value: 'A ' },
      { type: 'word', value: 'vento', tagSom: 'vento_tempestade_mar', textoParaAudio: 'Fuu' },
      { type: 'text', value: ' e ' },
      { type: 'word', value: 'mar', tagSom: 'som_mar_vermelho', textoParaAudio: 'Splash' },
      { type: 'text', value: ' e ' },
      { type: 'word', value: 'chuva', tagSom: 'chuva_suave', textoParaAudio: 'Plof' },
    ]);

    expect(parts.filter((p) => p.type === 'word')).toHaveLength(2);
    expect(parts.find((p) => p.type === 'text' && p.value === 'chuva')).toBeTruthy();
  });
});

describe('buildInlineWordAriaLabel', () => {
  it('uses friendly Portuguese labels', () => {
    expect(buildInlineWordAriaLabel('vento', 'vento_tempestade_mar')).toBe('Tocar som de vento');
    expect(buildInlineWordAriaLabel('Coragem', 'fala_jesus_coragem')).toBe('Ouvir fala: Coragem');
  });
});
