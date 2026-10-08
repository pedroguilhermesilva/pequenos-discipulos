import { describe, expect, it } from 'vitest';
import { FRIENDLY_GENERATION_ERROR } from '@/lib/domain/errors';
import { readStoryGenerationResponse } from '@/lib/stories/request-story-generation';

function response(status: number, body: string) {
  return { ok: status >= 200 && status < 300, status, text: async () => body } as Response;
}

describe('readStoryGenerationResponse', () => {
  it('returns data on success', async () => {
    const data = { userStoryId: 'u', adaptationId: 'a', title: 't' };
    expect(await readStoryGenerationResponse(response(200, JSON.stringify({ ok: true, data })))).toEqual({ ok: true, data });
  });

  it('passes the story content through so the client can show it without a refetch (no flicker)', async () => {
    const data = {
      userStoryId: 'u',
      adaptationId: 'a',
      title: 't',
      content: { pages: [{ paragraphs: [[{ type: 'text', value: 'Olá' }]] }] },
      quiz: undefined,
      adaptationNote: 'nota',
    };
    const r = await readStoryGenerationResponse(response(200, JSON.stringify({ ok: true, data })));
    expect(r.ok && r.data.content).toEqual(data.content);
    expect(r.ok && r.data.adaptationNote).toBe('nota');
  });

  it('uses the API friendly message and retryable flag on failure', async () => {
    const r = await readStoryGenerationResponse(
      response(502, JSON.stringify({ ok: false, message: FRIENDLY_GENERATION_ERROR, retryable: true }))
    );
    expect(r).toEqual({ ok: false, message: FRIENDLY_GENERATION_ERROR, retryable: true });
  });

  it('handles non-JSON responses (e.g. 504 timeout page) with a friendly message', async () => {
    const r = await readStoryGenerationResponse(response(504, '<html>An error occurred</html>'));
    expect(r).toEqual({ ok: false, message: FRIENDLY_GENERATION_ERROR, retryable: true });
  });

  it('never shows raw validation text even if an old API sends it', async () => {
    const r = await readStoryGenerationResponse(
      response(400, JSON.stringify({ ok: false, code: 'LLM_VALIDATION_ERROR', message: 'quiz.title: expected string, received undefined' }))
    );
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toBe(FRIENDLY_GENERATION_ERROR);
  });

  it('limit errors are not retryable and keep their message', async () => {
    const r = await readStoryGenerationResponse(
      response(402, JSON.stringify({ ok: false, code: 'GENERATION_LIMIT_EXCEEDED', message: 'Limite mensal de gerações atingido.', retryable: false }))
    );
    expect(r).toEqual({ ok: false, message: 'Limite mensal de gerações atingido.', retryable: false });
  });
});
