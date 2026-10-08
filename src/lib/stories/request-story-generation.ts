import { FRIENDLY_GENERATION_ERROR } from '@/lib/domain/errors';

export type StoryGenerationData = { userStoryId: string; adaptationId: string; title: string };

export type StoryGenerationOutcome =
  | { ok: true; data: StoryGenerationData }
  | { ok: false; message: string; retryable: boolean };

type ApiBody = {
  ok?: boolean;
  code?: string;
  message?: string;
  retryable?: boolean;
  data?: StoryGenerationData;
};

const TECHNICAL_CODES = new Set(['LLM_VALIDATION_ERROR', 'LLM_UNAVAILABLE', 'LLM_NOT_CONFIGURED', 'INTERNAL_ERROR']);

/** Lê a resposta de POST /api/stories/generate sem nunca mostrar erros técnicos ao utilizador. */
export async function readStoryGenerationResponse(response: Response): Promise<StoryGenerationOutcome> {
  let body: ApiBody | null = null;
  try {
    body = JSON.parse(await response.text()) as ApiBody;
  } catch {
    body = null;
  }

  if (response.ok && body?.ok && body.data) {
    return { ok: true, data: body.data };
  }

  if (!body) {
    return { ok: false, message: FRIENDLY_GENERATION_ERROR, retryable: true };
  }

  const technical = !body.code || TECHNICAL_CODES.has(body.code) || response.status >= 500;
  const message = technical || !body.message ? FRIENDLY_GENERATION_ERROR : body.message;
  const retryable = body.retryable ?? (technical || response.status >= 500);

  return { ok: false, message, retryable };
}
