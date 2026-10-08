import { describe, expect, it, vi, afterEach } from 'vitest';
import { DomainError, FRIENDLY_GENERATION_ERROR, LlmValidationError } from '@/lib/domain/errors';
import { ChatCompletionsLlmProvider } from '@/lib/providers/llm/chat-completions.provider';

const validResponse = {
  title: 'História de Mateus',
  adaptationNote: 'Simplificado para crianças.',
  content: {
    pages: [
      {
        paragraphs: [
          [
            { type: 'text', value: 'Era uma vez ' },
            { type: 'word', value: 'Jesus', variant: 'vida' },
            { type: 'text', value: '.' },
          ],
        ],
      },
    ],
  },
};

describe('ChatCompletionsLlmProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a valid chat completions response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(validResponse) } }],
        }),
      })
    );

    const provider = new ChatCompletionsLlmProvider({
      apiKey: 'test-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      providerName: 'OpenAI',
    });

    const result = await provider.generateStory({
      reference: 'Mateus 1:1-3',
      ageTier: '3-5',
      languageStyle: 'simple',
      contentType: 'text',
    });

    expect(result.title).toBe('História de Mateus');
    expect(result.content.pages).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    );
  });
});

describe('ChatCompletionsLlmProvider — structured outputs, retry and friendly errors', () => {
  const params = {
    reference: 'Mateus 14:24–27',
    ageTier: '3-5' as const,
    languageStyle: 'simple',
    contentType: 'text' as const,
  };

  const goodStory = {
    metadata: { livro: 'Mateus', capitulo: 14, versiculo: '24-27', idade_alvo: 4 },
    conteudo_estruturado: [
      {
        tipo: 'texto',
        conteudo: 'Os amigos estavam no barco. O vento soprava.',
        marcadores_interativos: [
          { palavra: 'vento', texto_para_audio: 'Fuuuu!', tag_som: 'vento_tempestade_mar' },
        ],
      },
      { tipo: 'texto', conteudo: 'Jesus acalmou o mar.', marcadores_interativos: [] },
    ],
    quiz: {
      title: 'Vamos relembrar?',
      subtitle: 'Toque na resposta.',
      celebrationTitle: 'Muito bem!',
      celebrationMessage: 'Jesus cuida de nós.',
      questions: [
        {
          id: 'q1',
          type: 'choice',
          prompt: 'Onde estavam?',
          options: [
            { id: 'a', label: 'No barco', icon: 'sailing' },
            { id: 'b', label: 'No monte', icon: 'landscape' },
            { id: 'c', label: 'Na cidade', icon: 'location_city' },
          ],
          correctOptionId: 'a',
          encouragementCorrect: 'Isso!',
          encouragementAlmost: 'Quase!',
        },
      ],
    },
  };

  const badStory = {
    ...goodStory,
    conteudo_estruturado: [
      { tipo: 'texto', conteudo: 'SEGREDO_DA_HISTORIA texto longo da história.', marcadores_interativos: [] },
      { tipo: 'texto', conteudo: 'Fim.', marcadores_interativos: 'invalid' },
    ],
    quiz: {},
  };

  function completion(content: unknown) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
    };
  }

  function bodyOf(call: unknown[]) {
    return JSON.parse(String((call[1] as RequestInit).body)) as {
      response_format: { type: string; json_schema?: { name: string; strict: boolean; schema: unknown } };
      messages: Array<{ role: string; content: string }>;
    };
  }

  function provider(baseUrl = 'https://api.openai.com/v1', extra: Record<string, unknown> = {}) {
    return new ChatCompletionsLlmProvider({ apiKey: 'sk-test', baseUrl, model: 'gpt-4o-mini', ...extra });
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses strict json_schema structured outputs for OpenAI', async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(goodStory));
    vi.stubGlobal('fetch', fetchMock);

    const result = await provider().generateStory(params);

    expect(result.content.pages.length).toBeGreaterThan(0);
    expect(result.quiz?.questions).toHaveLength(1);
    const body = bodyOf(fetchMock.mock.calls[0]);
    expect(body.response_format.type).toBe('json_schema');
    expect(body.response_format.json_schema?.strict).toBe(true);
    expect(body.response_format.json_schema?.schema).toBeTruthy();
  });

  it('uses json_object for other OpenAI-compatible providers, with the JSON shape spelled out in the prompt', async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(goodStory));
    vi.stubGlobal('fetch', fetchMock);

    await provider('https://api.groq.com/openai/v1').generateStory(params);

    const body = bodyOf(fetchMock.mock.calls[0]);
    expect(body.response_format).toEqual({ type: 'json_object' });
    const system = body.messages.find((m) => m.role === 'system')!.content;
    for (const field of ['marcadores_interativos', 'palavra', 'texto_para_audio', 'tag_som', 'celebrationTitle', 'celebrationMessage', 'questions', 'correctOptionId']) {
      expect(system).toContain(field);
    }
  });

  it('falls back to json_object when the API rejects json_schema', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: { message: "Invalid parameter: 'response_format' of type 'json_schema' is not supported with this model." } }),
      })
      .mockResolvedValueOnce(completion(goodStory));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await provider().generateStory(params);

    expect(result.title).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodyOf(fetchMock.mock.calls[1]).response_format).toEqual({ type: 'json_object' });
  });

  it('retries once after an invalid response and succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(completion(badStory)).mockResolvedValueOnce(completion(goodStory));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await provider().generateStory(params);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.content.pages.length).toBeGreaterThan(0);
  });

  it('after two invalid responses throws a friendly error and logs details without the story text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(badStory));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = await provider().generateStory(params).catch((e: unknown) => e);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(error).toBeInstanceOf(LlmValidationError);
    expect((error as Error).message).toBe(FRIENDLY_GENERATION_ERROR);
    const logged = errorSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
    expect(logged).toMatch(/conteudo_estruturado|marcadores_interativos/);
    expect(logged).toContain('gpt-4o-mini');
    expect(logged).not.toContain('SEGREDO_DA_HISTORIA');
    expect(logged).not.toContain('sk-test');
  });

  it('HTTP errors from the LLM API are logged and shown as a friendly message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => '{"error":{"message":"Incorrect API key provided: sk-te****"}}' })
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = await provider().generateStory(params).catch((e: unknown) => e);

    expect((error as DomainError).code).toBe('LLM_UNAVAILABLE');
    expect((error as Error).message).toBe(FRIENDLY_GENERATION_ERROR);
    expect(errorSpy.mock.calls.flat().join(' ')).toContain('401');
  });
});
