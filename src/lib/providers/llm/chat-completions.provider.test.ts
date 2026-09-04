import { describe, expect, it, vi, afterEach } from 'vitest';
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
      sourceText: 'Texto bíblico',
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
