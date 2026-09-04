import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioService, STORY_NARRATION_BLOCK_KEY } from '@/lib/services/audio.service';
import type { AdaptationContent } from '@/lib/domain/schemas';

function alignmentFromText(text: string, charDuration = 0.08) {
  const characters = [...text];
  return {
    characters,
    characterStartTimesSeconds: characters.map((_, index) => index * charDuration),
    characterEndTimesSeconds: characters.map((_, index) => (index + 1) * charDuration),
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
      filePath: `audio/ad-1/${STORY_NARRATION_BLOCK_KEY}.mp3`,
    });
    tts.generateSpeechWithTimestamps.mockResolvedValue({
      buffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      durationMs: 1840,
      alignment: alignmentFromText(fullText),
    });

    const service = new AudioService(prisma as never, tts, sfx as never, storage as never);
    const result = await service.ensurePageNarration('ad-1', 1);

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
      },
    });

    const service = new AudioService(prisma as never, tts, sfx as never, storage as never);
    const result = await service.ensurePageNarration('ad-1', 0);

    expect(tts.generateSpeechWithTimestamps).not.toHaveBeenCalled();
    expect(prisma.audioAsset.findUnique).not.toHaveBeenCalled();
    expect(result.url).toBe('/files/story.mp3');
    expect(result.pages).toHaveLength(2);
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
        characters: ['O', 'i'],
        characterStartTimesSeconds: [0, 0.1],
        characterEndTimesSeconds: [0.1, 0.2],
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

    const service = new AudioService(prisma as never, tts as never, sfx as never, storage as never);
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
                      audioPath: '/api/storage/audio/adaptation-1/p0-par0-part2.mp3',
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

    const service = new AudioService(prisma as never, tts as never, sfx as never, storage as never);
    await service.prepareAdaptationAudio('adaptation-1');

    expect(sfx.generateSound).not.toHaveBeenCalled();
    expect(tts.generateSpeech).not.toHaveBeenCalled();
    expect(prisma.passageAdaptation.update).not.toHaveBeenCalled();
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

    const service = new AudioService(prisma as never, tts as never, sfx as never, storage as never);
    await service.prepareAdaptationAudio('adaptation-audio');

    expect(tts.generateSpeechWithTimestamps).toHaveBeenCalledTimes(1);
    expect(prisma.passageAdaptation.update).toHaveBeenCalledTimes(1);
  });
});
