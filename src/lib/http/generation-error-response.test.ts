import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  DomainError,
  FRIENDLY_GENERATION_ERROR,
  GenerationLimitExceeded,
  LlmValidationError,
} from '@/lib/domain/errors';
import { generationErrorResponse } from '@/lib/http/generation-error-response';

describe('generationErrorResponse', () => {
  it('LLM output failure → 502, friendly message, retryable', () => {
    const r = generationErrorResponse(new LlmValidationError(FRIENDLY_GENERATION_ERROR, 'quiz.title: expected string'));
    expect(r.status).toBe(502);
    expect(r.body).toEqual({ ok: false, code: 'LLM_VALIDATION_ERROR', message: FRIENDLY_GENERATION_ERROR, retryable: true });
  });

  it('never leaks a raw Zod/technical message for LLM errors', () => {
    const r = generationErrorResponse(new DomainError('LLM_VALIDATION_ERROR', 'conteudo_estruturado[1].rotulo: expected string, received undefined'));
    expect(r.body.message).toBe(FRIENDLY_GENERATION_ERROR);
  });

  it('LLM API unavailable / not configured → 503 friendly', () => {
    expect(generationErrorResponse(new DomainError('LLM_UNAVAILABLE', 'x')).status).toBe(503);
    expect(generationErrorResponse(new DomainError('LLM_NOT_CONFIGURED', 'x')).status).toBe(503);
  });

  it('generation limit → 402, keeps its message, not retryable', () => {
    const r = generationErrorResponse(new GenerationLimitExceeded());
    expect(r.status).toBe(402);
    expect(r.body.message).toBe('Limite mensal de gerações atingido.');
    expect(r.body.retryable).toBe(false);
  });

  it('invalid request input (ZodError) → 400 with a friendly message', () => {
    const zodError = z.object({ a: z.string() }).safeParse({}).error!;
    const r = generationErrorResponse(zodError);
    expect(r.status).toBe(400);
    expect(r.body.message).not.toMatch(/expected|received/);
  });

  it('unexpected errors → 500 friendly, retryable, logged', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = generationErrorResponse(new Error('db down'));
    expect(r.status).toBe(500);
    expect(r.body.message).toBe(FRIENDLY_GENERATION_ERROR);
    expect(r.body.retryable).toBe(true);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
