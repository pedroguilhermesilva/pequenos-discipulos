import { describe, expect, it } from 'vitest';
import { buildPedagogicalStoryUserPrompt } from '@/lib/llm/story-generation.prompt';
import type { LlmGenerateStoryParams } from '@/lib/providers/interfaces/llm.provider';

const CHILD_NAMES = ['Davi', 'Maria Clara', 'Joãozinho', 'Lulu'];

describe('child name privacy guard', () => {
  const baseParams: LlmGenerateStoryParams = {
    reference: 'Mateus 2:1–3',
    ageTier: '3-5',
    languageStyle: 'simple',
    contentType: 'text',
  };

  it('LLM user prompt never includes child profile names', () => {
    const prompt = buildPedagogicalStoryUserPrompt(baseParams);

    for (const name of CHILD_NAMES) {
      expect(prompt).not.toContain(name);
    }
    expect(prompt).not.toMatch(/childName|childProfile|apelido/i);
  });

  it('LLM params type has no child identity fields', () => {
    const keys = Object.keys(baseParams);
    expect(keys).not.toContain('childName');
    expect(keys).not.toContain('childProfileId');
  });
});
