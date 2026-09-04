export type DomainErrorCode =
  | 'GENERATION_LIMIT_EXCEEDED'
  | 'PROFILE_LIMIT_EXCEEDED'
  | 'ADAPTATION_NOT_FOUND'
  | 'BIBLE_TEXT_FETCH_ERROR'
  | 'LLM_VALIDATION_ERROR'
  | 'LLM_NOT_CONFIGURED'
  | 'TTS_NOT_CONFIGURED'
  | 'SFX_NOT_CONFIGURED'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND';

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class GenerationLimitExceeded extends DomainError {
  constructor(message = 'Limite mensal de gerações atingido.') {
    super('GENERATION_LIMIT_EXCEEDED', message);
    this.name = 'GenerationLimitExceeded';
  }
}

export class ProfileLimitExceeded extends DomainError {
  constructor(message = 'Limite de perfis do plano atingido.') {
    super('PROFILE_LIMIT_EXCEEDED', message);
    this.name = 'ProfileLimitExceeded';
  }
}

export class AdaptationNotFound extends DomainError {
  constructor(message = 'Adaptação não encontrada.') {
    super('ADAPTATION_NOT_FOUND', message);
    this.name = 'AdaptationNotFound';
  }
}

export class BibleTextFetchError extends DomainError {
  constructor(message = 'Não foi possível obter o texto bíblico.') {
    super('BIBLE_TEXT_FETCH_ERROR', message);
    this.name = 'BibleTextFetchError';
  }
}

export class LlmValidationError extends DomainError {
  constructor(message = 'A IA devolveu conteúdo inválido.') {
    super('LLM_VALIDATION_ERROR', message);
    this.name = 'LlmValidationError';
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: DomainErrorCode; message: string };

export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof DomainError) {
    return { ok: false, code: error.code, message: error.message };
  }

  console.error(error);
  return {
    ok: false,
    code: 'VALIDATION_ERROR',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
  };
}
