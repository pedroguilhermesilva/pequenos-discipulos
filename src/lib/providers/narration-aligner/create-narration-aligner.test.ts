import { describe, expect, it, vi } from 'vitest';
import {
  createNarrationAligner,
  parseNarrationAligner,
} from '@/lib/providers/narration-aligner/create-narration-aligner';
import { GoogleNarrationAligner } from '@/lib/providers/narration-aligner/google-narration-aligner';
import { GroqWhisperNarrationAligner } from '@/lib/providers/narration-aligner/groq-whisper-narration-aligner';

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

describe('createNarrationAligner', () => {
  it('defaults to Google aligner', () => {
    const aligner = createNarrationAligner(
      env({}),
      { credentialsJson: '{}', projectId: 'demo-project', languageCode: 'pt-BR' }
    );

    expect(parseNarrationAligner(undefined)).toBe('google');
    expect(aligner).toBeInstanceOf(GoogleNarrationAligner);
    expect(aligner.id).toBe('google');
  });

  it('creates Groq aligner when configured', () => {
    const aligner = createNarrationAligner(
      env({ NARRATION_ALIGNER: 'groq', GROQ_API_KEY: 'gsk-test' }),
      { credentialsJson: '{}', projectId: 'demo-project', languageCode: 'pt-BR' }
    );

    expect(aligner).toBeInstanceOf(GroqWhisperNarrationAligner);
    expect(aligner.id).toBe('groq');
  });

  it('falls back to Google aligner (no throw) when Groq is selected without GROQ_API_KEY', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const aligner = createNarrationAligner(
      env({ NARRATION_ALIGNER: 'groq' }),
      { credentialsJson: '{}', projectId: 'demo-project', languageCode: 'pt-BR' }
    );

    expect(aligner).toBeInstanceOf(GoogleNarrationAligner);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('GROQ_API_KEY'));
    warnSpy.mockRestore();
  });

  it('does not throw when Google aligner is created without project ID', () => {
    expect(() =>
      createNarrationAligner(env({}), { languageCode: 'pt-BR' })
    ).not.toThrow();
  });
});
