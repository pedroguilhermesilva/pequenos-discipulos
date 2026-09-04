import { describe, expect, it } from 'vitest';
import { parseElevenLabsError } from '@/lib/providers/elevenlabs/parse-elevenlabs-error';

describe('parseElevenLabsError', () => {
  it('maps paid plan required to a friendly message', () => {
    expect(
      parseElevenLabsError(
        402,
        '{"detail":{"type":"payment_required","code":"paid_plan_required"}}'
      )
    ).toContain('plano pago');
  });

  it('maps invalid api key', () => {
    expect(parseElevenLabsError(401, '')).toContain('inválida');
  });
});
