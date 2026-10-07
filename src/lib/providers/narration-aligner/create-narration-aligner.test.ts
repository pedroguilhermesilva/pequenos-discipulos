import { describe, expect, it } from 'vitest';
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
      { apiKey: 'test-key', projectId: 'demo-project', languageCode: 'pt-BR' }
    );

    expect(parseNarrationAligner(undefined)).toBe('google');
    expect(aligner).toBeInstanceOf(GoogleNarrationAligner);
    expect(aligner.id).toBe('google');
  });

  it('creates Groq aligner when configured', () => {
    const aligner = createNarrationAligner(
      env({ NARRATION_ALIGNER: 'groq', GROQ_API_KEY: 'gsk-test' }),
      { apiKey: 'test-key', projectId: 'demo-project', languageCode: 'pt-BR' }
    );

    expect(aligner).toBeInstanceOf(GroqWhisperNarrationAligner);
    expect(aligner.id).toBe('groq');
  });

  it('throws when Groq is selected without API key', () => {
    expect(() =>
      createNarrationAligner(
        env({ NARRATION_ALIGNER: 'groq' }),
        { apiKey: 'test-key', projectId: 'demo-project', languageCode: 'pt-BR' }
      )
    ).toThrow(/GROQ_API_KEY/);
  });
});
