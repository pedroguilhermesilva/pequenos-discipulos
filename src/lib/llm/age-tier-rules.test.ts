import { describe, expect, it } from 'vitest';
import {
  AGE_TIER_RULES,
  buildAgeTierPromptSection,
  SENSITIVE_PASSAGE_REFERENCES,
} from '@/lib/llm/age-tier-rules';
import type { AgeTier } from '@/lib/stories/age-tiers';

const TIERS: AgeTier[] = ['3-5', '6-8', '9-11'];

describe('AGE_TIER_RULES', () => {
  it.each(TIERS)('defines can and cannot rules for tier %s', (tier) => {
    const rules = AGE_TIER_RULES[tier];
    expect(rules.can.length).toBeGreaterThan(0);
    expect(rules.cannot.length).toBeGreaterThan(0);
    expect(rules.sensitiveExample).toMatch(/crucifi/i);
  });

  it('covers all sensitive passages listed in issue #12', () => {
    expect(SENSITIVE_PASSAGE_REFERENCES).toEqual(
      expect.arrayContaining([
        'Mateus 2:16-18',
        'Gênesis 7:11-24',
        'Êxodo 7:14-12:30',
        '1 Samuel 17:1-51',
        'Juízes 16:1-30',
        'Mateus 27:32-56',
      ])
    );
  });

  it.each(TIERS)(
    'prompt section for %s forbids graphic violence for younger tiers',
    (tier) => {
      const section = buildAgeTierPromptSection(tier);
      expect(section).toMatch(/Não pode/i);
      if (tier === '3-5') {
        expect(section).toMatch(/dor|sangue|medo/i);
        expect(section).toMatch(/morreu por amor/i);
      }
      if (tier === '6-8') {
        expect(section).toMatch(/sofrimento|violent/i);
        expect(section).toMatch(/morreu na cruz/i);
      }
      if (tier === '9-11') {
        expect(section).toMatch(/gráficas|violência/i);
        expect(section).toMatch(/prisão|julgamento|cruz/i);
      }
    }
  );
});
