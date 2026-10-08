import { ZodError } from 'zod';
import { DomainError, FRIENDLY_GENERATION_ERROR, LlmValidationError } from '@/lib/domain/errors';

export type GenerationErrorBody = {
  ok: false;
  code: string;
  message: string;
  /** O cliente mostra "Tentar novamente" quando true. */
  retryable: boolean;
};

const LLM_FAILURE_CODES = new Set(['LLM_VALIDATION_ERROR', 'LLM_UNAVAILABLE', 'LLM_NOT_CONFIGURED']);

/**
 * Converte erros da geração de histórias numa resposta HTTP segura para o utilizador.
 * Falhas do modelo são 5xx (502/503), não 400 — o pedido do utilizador estava certo.
 */
export function generationErrorResponse(error: unknown): { status: number; body: GenerationErrorBody } {
  if (error instanceof DomainError) {
    if (LLM_FAILURE_CODES.has(error.code)) {
      const details = error instanceof LlmValidationError ? error.details : undefined;
      console.error(`[generate] ${error.code}: ${details ?? error.message}`);
      return {
        status: error.code === 'LLM_VALIDATION_ERROR' ? 502 : 503,
        body: { ok: false, code: error.code, message: FRIENDLY_GENERATION_ERROR, retryable: true },
      };
    }

    const status =
      error.code === 'GENERATION_LIMIT_EXCEEDED' || error.code === 'PROFILE_LIMIT_EXCEEDED'
        ? 402
        : error.code === 'UNAUTHORIZED'
          ? 401
          : error.code === 'ADAPTATION_NOT_FOUND' || error.code === 'NOT_FOUND'
            ? 404
            : error.code === 'VALIDATION_ERROR'
              ? 400
              : 500;

    return {
      status,
      body: { ok: false, code: error.code, message: error.message, retryable: status >= 500 },
    };
  }

  if (error instanceof ZodError) {
    console.error('[generate] Pedido inválido:', error.issues.slice(0, 5));
    return {
      status: 400,
      body: {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Os dados da história estão incompletos. Volte e escolha a passagem de novo.',
        retryable: false,
      },
    };
  }

  console.error('[generate] Erro inesperado:', error);
  return {
    status: 500,
    body: { ok: false, code: 'INTERNAL_ERROR', message: FRIENDLY_GENERATION_ERROR, retryable: true },
  };
}
