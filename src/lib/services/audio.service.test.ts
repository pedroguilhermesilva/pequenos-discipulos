import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_GOOGLE_TTS_VOICE, ttsCacheBlockKey } from '@/lib/providers/google/google-tts-config';
import { AudioService, STORY_NARRATION_BLOCK_KEY } from '@/lib/services/audio.service';
import type { AdaptationContent } from '@/lib/domain/schemas';

import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';

const TTS_VOICE = DEFAULT_GOOGLE_TTS_VOICE;
const NARRATION_CACHE_KEY = ttsCacheBlockKey(STORY_NARRATION_BLOCK_KEY, TTS_VOICE);

function alignmentFromText(text: string, wordDuration = 0.35) {
  const tokens = tokenizeNarrationWords(text);

  return {
    words: tokens.map((token) => token.text),
    wordStartTimesSeconds: tokens.map((_, index) => index * wordDuration),
    wordEndTimesSeconds: tokens.map((_, index) => (index + 1) * wordDuration),
    wordCharStarts: tokens.map((token) => token.charStart),
    wordCharEnds: tokens.map((token) => token.charEnd),
  };
}

function twoPageContent(): AdaptationContent {
  return {
    pages: [
      { paragraphs: [[{ type: 'text', value: 'Página um.' }]] },
      { paragraphs: [[{ type: 'text', value: 'Página dois.' }]] },
    ],
  };
}

function createService(
  prisma: unknown,
  tts: unknown,
  sfx: unknown,
  storage: unknown,
  voice = TTS_VOICE
) {
  return new AudioService(prisma as never, tts as never, sfx as never, storage as never, voice);
}

describe('AudioService story narration', () => {
  const prisma = {
    passageAdaptation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    audioAsset: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  const tts = {
    generateSpeech: vi.fn(),
    generateSpeechWithTimestamps: vi.fn(),
  };
  const sfx = {
    generateSound: vi.fn(),
  };
  const storage = {
    save: vi.fn(),
    getPublicUrl: vi.fn((path: string) => `/files/${path}`),
    exists: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates one TTS for the full story and stores page slices', async () => {
    const content = twoPageContent();
    const fullText = 'Página um. Página dois.';
    prisma.passageAdaptation.findUnique.mockResolvedValue({
      id: 'ad-1',
      content,
    });
    prisma.audioAsset.findUnique.mockResolvedValue(null);
    prisma.audioAsset.create.mockResolvedValue({
      id: 'asset-1',
      filePath: `audio/ad-1/${NARRATION_CACHE_KEY}.mp3`,
    });
    tts.generateSpeechWithTimestamps.mockResolvedValue({
      buffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      durationMs: 1840,
      alignment: alignmentFromText(fullText),
    });

    const service = createService(prisma, tts, sfx, storage);
    const result = await service.ensurePageNarration('ad-1', 1);

    expect(prisma.audioAsset.findUnique).toHaveBeenCalledWith({
      where: {
        adaptationId_blockKey: { adaptationId: 'ad-1', blockKey: NARRATION_CACHE_KEY },
      },
    });
    expect(tts.generateSpeechWithTimestamps).toHaveBeenCalledTimes(1);
    expect(tts.generateSpeechWithTimestamps).toHaveBeenCalledWith({
      text: fullText,
      blockKey: STORY_NARRATION_BLOCK_KEY,
    });
    expect(result.pages).toHaveLength(2);
    expect(result.startSeconds).toBeGreaterThan(0);
    expect(prisma.passageAdaptation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: expect.objectContaining({
            storyNarrationAudioPath: expect.any(String),
            storyNarrationVoice: TTS_VOICE,
            pages: expect.arrayContaining([
              expect.objectContaining({
                narrationAudioPath: expect.any(String),
                narrationStartSeconds: expect.any(Number),
                narrationEndSeconds: expect.any(Number),
              }),
            ]),
          }),
        }),
      })
    );
  });

  it('reuses stored story narration without calling TTS', async () => {
    const fullText = 'Página um. Página dois.';
    const alignment = alignmentFromText(fullText);
    prisma.passageAdaptation.findUnique.mockResolvedValue({
      id: 'ad-1',
      content: {
        ...twoPageContent(),
        storyNarrationAudioPath: '/files/story.mp3',
        storyNarrationAlignment: alignment,
        storyNarrationVoice: TTS_VOICE,
      },
    });

    const service = createService(prisma, tts, sfx, storage);
    const result = await service.ensurePageNarration('ad-1', 0);

    expect(tts.generateSpeechWithTimestamps).not.toHaveBeenCalled();
    expect(prisma.audioAsset.findUnique).not.toHaveBeenCalled();
    expect(result.url).toBe('/files/story.mp3');
    expect(result.pages).toHaveLength(2);
  });

  it('regenerates narration when stored voice differs from configured voice', async () => {
    const fullText = 'Página um. Página dois.';
    const alignment = alignmentFromText(fullText);
    prisma.passageAdaptation.findUnique.mockResolvedValue({
      id: 'ad-1',
      content: {
        ...twoPageContent(),
        storyNarrationAudioPath: '/files/story-wavenet.mp3',
        storyNarrationAlignment: alignment,
        storyNarrationVoice: 'pt-BR-Wavenet-A',
      },
    });
    prisma.audioAsset.findUnique.mockResolvedValue(null);
    prisma.audioAsset.create.mockResolvedValue({
      id: 'asset-1',
      filePath: `audio/ad-1/${NARRATION_CACHE_KEY}.mp3`,
    });
    tts.generateSpeechWithTimestamps.mockResolvedValue({
      buffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      durationMs: 1840,
      alignment,
    });

    const service = createService(prisma, tts, sfx, storage);
    await service.ensurePageNarration('ad-1', 0);

    expect(tts.generateSpeechWithTimestamps).toHaveBeenCalledTimes(1);
  });
});

describe('AudioService.prepareAdaptationAudio', () => {
  const prisma = {
    passageAdaptation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    audioAsset: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  const tts = {
    generateSpeech: vi.fn(),
    generateSpeechWithTimestamps: vi.fn(),
  };
  const sfx = {
    generateSound: vi.fn(),
  };
  const storage = {
    save: vi.fn(),
    getPublicUrl: vi.fn((path: string) => `/api/storage/${path}`),
    exists: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sfx.generateSound).mockResolvedValue({
      buffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      durationMs: 400,
    });
    vi.mocked(tts.generateSpeech).mockResolvedValue({
      buffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      durationMs: 800,
    });
    vi.mocked(tts.generateSpeechWithTimestamps).mockResolvedValue({
      buffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      durationMs: 1200,
      alignment: {
        words: ['Oi'],
        wordStartTimesSeconds: [0],
        wordEndTimesSeconds: [0.2],
        wordCharStarts: [0],
        wordCharEnds: [2],
      },
    });
    vi.mocked(storage.save).mockResolvedValue('saved');
    vi.mocked(prisma.audioAsset.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.audioAsset.create).mockImplementation(async ({ data }) => ({
      id: `asset-${data.blockKey}`,
      adaptationId: data.adaptationId,
      blockKey: data.blockKey,
      filePath: data.filePath,
      durationMs: data.durationMs,
      createdAt: new Date(),
    }));
    vi.mocked(prisma.passageAdaptation.update).mockResolvedValue({} as never);
  });

  it('generates interactive sounds and persists audioPath on text adaptations', async () => {
    vi.mocked(prisma.passageAdaptation.findUnique).mockResolvedValue({
      id: 'adaptation-1',
      contentType: 'text',
      content: {
        pages: [
          {
            paragraphs: [
              [
                { type: 'text', value: 'Era uma ' },
                { type: 'word', value: 'estrela' },
                {
                  type: 'interactive',
                  rotulo: 'Ouvir Jesus',
                  textoParaAudio: 'Coragem!',
                  tagSom: 'fala_jesus_coragem',
                },
              ],
            ],
          },
        ],
      },
    });

    const service = createService(prisma, tts, sfx, storage);
    await service.prepareAdaptationAudio('adaptation-1');

    expect(sfx.generateSound).toHaveBeenCalledTimes(1);
    expect(tts.generateSpeech).toHaveBeenCalledTimes(1);
    expect(prisma.passageAdaptation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'adaptation-1' },
        data: expect.objectContaining({
          content: expect.objectContaining({
            pages: [
              {
                paragraphs: [
                  [
                    { type: 'text', value: 'Era uma ' },
                    {
                      type: 'word',
                      value: 'estrela',
                      audioPath: '/api/storage/audio/adaptation-1/p0-par0-part1.mp3',
                    },
                    {
                      type: 'interactive',
                      rotulo: 'Ouvir Jesus',
                      textoParaAudio: 'Coragem!',
                      tagSom: 'fala_jesus_coragem',
                      audioPath: `/api/storage/audio/adaptation-1/p0-par0-part2@${TTS_VOICE}.mp3`,
                    },
                  ],
                ],
              },
            ],
          }),
        }),
      })
    );
  });

  it('skips generation when interactive audioPath already exists', async () => {
    vi.mocked(prisma.passageAdaptation.findUnique).mockResolvedValue({
      id: 'adaptation-1',
      contentType: 'text',
      content: {
        pages: [
          {
            paragraphs: [
              [
                {
                  type: 'word',
                  value: 'estrela',
                  audioPath: '/api/storage/audio/adaptation-1/p0-par0-part0.mp3',
                },
              ],
            ],
          },
        ],
      },
    });

    const service = createService(prisma, tts, sfx, storage);
    await service.prepareAdaptationAudio('adaptation-1');

    expect(sfx.generateSound).not.toHaveBeenCalled();
    expect(tts.generateSpeech).not.toHaveBeenCalled();
    expect(prisma.passageAdaptation.update).not.toHaveBeenCalled();
  });

  it('sends only story text to TTS — never child profile names', async () => {
    const content = twoPageContent();
    const childName = 'Maria Clara';
    prisma.passageAdaptation.findUnique.mockResolvedValue({
      id: 'ad-1',
      content,
    });
    prisma.audioAsset.findUnique.mockResolvedValue(null);
    prisma.audioAsset.create.mockResolvedValue({
      id: 'asset-1',
      filePath: `audio/ad-1/${NARRATION_CACHE_KEY}.mp3`,
    });
    tts.generateSpeechWithTimestamps.mockResolvedValue({
      buffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      durationMs: 1840,
      alignment: alignmentFromText('Página um. Página dois.'),
    });

    const service = createService(prisma, tts, sfx, storage);
    await service.ensurePageNarration('ad-1', 0);

    const ttsCall = vi.mocked(tts.generateSpeechWithTimestamps).mock.calls[0]?.[0];
    expect(ttsCall?.text).not.toContain(childName);
    expect(JSON.stringify(ttsCall)).not.toMatch(/childName|childProfile|apelido/i);
  });

  it('pre-generates the full story narration for audio adaptations', async () => {
    vi.mocked(prisma.passageAdaptation.findUnique).mockResolvedValue({
      id: 'adaptation-audio',
      contentType: 'audio',
      content: {
        pages: [
          { paragraphs: [[{ type: 'text', value: 'Primeira página.' }]] },
          { paragraphs: [[{ type: 'text', value: 'Segunda página.' }]] },
        ],
      },
    });

    const service = createService(prisma, tts, sfx, storage);
    await service.prepareAdaptationAudio('adaptation-audio');

    expect(tts.generateSpeechWithTimestamps).toHaveBeenCalledTimes(1);
    expect(prisma.passageAdaptation.update).toHaveBeenCalledTimes(1);
  });
});
