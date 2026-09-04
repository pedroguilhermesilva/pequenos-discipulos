import type { PrismaClient } from '@prisma/client';
import type { SfxProvider } from '@/lib/providers/interfaces/sfx.provider';
import type { StorageProvider } from '@/lib/providers/interfaces/storage.provider';
import type { TtsProvider } from '@/lib/providers/interfaces/tts.provider';
import {
  adaptationContentSchema,
  type AdaptationContent,
} from '@/lib/domain/schemas';
import { AdaptationNotFound, DomainError } from '@/lib/domain/errors';
import { extractStoryNarrationText } from '@/lib/stories/page-plain-text';
import { sliceStoryAlignment, type PageNarrationSlice } from '@/lib/stories/narration-alignment';
import { buildSfxPrompt } from '@/lib/stories/sfx-prompt';
import {
  resolveBlockAudioInput,
  type EnsureBlockAudioInput,
  type StoryInteractivePart,
} from '@/lib/stories/resolve-block-audio';

export type { EnsureBlockAudioInput };

export const STORY_NARRATION_BLOCK_KEY = 'story-narration';

const AUDIO_PREPARE_CONCURRENCY = 3;

function extensionForContentType(contentType: string): string {
  if (contentType.includes('mpeg') || contentType.includes('mp3')) {
    return '.mp3';
  }
  return '.wav';
}

function isInteractivePart(
  part: AdaptationContent['pages'][number]['paragraphs'][number][number]
): part is StoryInteractivePart {
  return part.type === 'word' || part.type === 'audio-pill' || part.type === 'interactive';
}

function hasPendingInteractiveAudio(content: AdaptationContent): boolean {
  return content.pages.some((page) =>
    page.paragraphs.some((paragraph) =>
      paragraph.some((part) => isInteractivePart(part) && !part.audioPath)
    )
  );
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;

  let cursor = 0;
  async function runNext() {
    while (cursor < items.length) {
      const current = cursor++;
      await worker(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runNext())
  );
}

export class AudioService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly tts: TtsProvider,
    private readonly sfx: SfxProvider,
    private readonly storage: StorageProvider
  ) {}

  async ensureBlockAudio(
    adaptationId: string,
    blockKey: string,
    input: EnsureBlockAudioInput
  ) {
    const existing = await this.prisma.audioAsset.findUnique({
      where: { adaptationId_blockKey: { adaptationId, blockKey } },
    });

    if (existing) {
      return {
        ...existing,
        url: this.storage.getPublicUrl(existing.filePath),
      };
    }

    const generated =
      input.kind === 'sfx'
        ? await this.sfx.generateSound({
            prompt: buildSfxPrompt(input.text, input.sfxPrompt),
            blockKey,
          })
        : await this.tts.generateSpeech({ text: input.text, blockKey });

    const extension = extensionForContentType(generated.contentType);
    const relativePath = `audio/${adaptationId}/${blockKey}${extension}`;
    await this.storage.save(relativePath, generated.buffer, generated.contentType);

    const asset = await this.prisma.audioAsset.create({
      data: {
        adaptationId,
        blockKey,
        filePath: relativePath,
        durationMs: generated.durationMs,
      },
    });

    return {
      ...asset,
      url: this.storage.getPublicUrl(asset.filePath),
    };
  }

  /**
   * Generates every interactive sound and page narration for an adaptation
   * so the reader can play immediately instead of waiting on click.
   */
  async prepareAdaptationAudio(adaptationId: string): Promise<void> {
    const adaptation = await this.prisma.passageAdaptation.findUnique({
      where: { id: adaptationId },
    });
    if (!adaptation) throw new AdaptationNotFound();

    if (adaptation.contentType === 'audio') {
      await this.ensureAllPageNarrations(adaptationId);
      return;
    }

    await this.hydrateContentAudio(adaptationId, adaptation.content);
  }

  async hydrateContentAudio(
    adaptationId: string,
    content: unknown
  ): Promise<AdaptationContent> {
    const adaptation = await this.prisma.passageAdaptation.findUnique({
      where: { id: adaptationId },
    });
    if (!adaptation) throw new AdaptationNotFound();

    const parsed = adaptationContentSchema.parse(content ?? adaptation.content);
    if (!hasPendingInteractiveAudio(parsed)) {
      return parsed;
    }

    const pages = parsed.pages.map((page) => ({
      ...page,
      paragraphs: page.paragraphs.map((paragraph) => paragraph.map((part) => ({ ...part }))),
    }));

    const jobs: Array<{
      pageIndex: number;
      paragraphIndex: number;
      partIndex: number;
      part: StoryInteractivePart;
    }> = [];

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      for (let paragraphIndex = 0; paragraphIndex < page.paragraphs.length; paragraphIndex++) {
        const paragraph = page.paragraphs[paragraphIndex];
        for (let partIndex = 0; partIndex < paragraph.length; partIndex++) {
          const part = paragraph[partIndex];
          if (!isInteractivePart(part) || part.audioPath) continue;
          jobs.push({ pageIndex, paragraphIndex, partIndex, part });
        }
      }
    }

    await runPool(jobs, AUDIO_PREPARE_CONCURRENCY, async (job) => {
      try {
        const blockKey = `p${job.pageIndex}-par${job.paragraphIndex}-part${job.partIndex}`;
        const asset = await this.ensureBlockAudio(
          adaptationId,
          blockKey,
          resolveBlockAudioInput(job.part)
        );
        pages[job.pageIndex].paragraphs[job.paragraphIndex][job.partIndex] = {
          ...job.part,
          audioPath: asset.url,
        };
      } catch (error) {
        console.error(
          `[Audio] Falha ao gerar som do bloco p${job.pageIndex}-par${job.paragraphIndex}-part${job.partIndex}`,
          error
        );
      }
    });

    const hydrated = {
      ...parsed,
      pages,
    };
    await this.prisma.passageAdaptation.update({
      where: { id: adaptationId },
      data: { content: hydrated },
    });

    return hydrated;
  }

  async ensureAllPageNarrations(adaptationId: string) {
    const adaptation = await this.prisma.passageAdaptation.findUnique({
      where: { id: adaptationId },
    });
    if (!adaptation) throw new AdaptationNotFound();

    const parsed = adaptationContentSchema.parse(adaptation.content);
    const firstPage = extractStoryNarrationText(parsed).pages[0];
    if (!firstPage) return;

    try {
      await this.ensurePageNarration(adaptationId, firstPage.pageIndex);
    } catch (error) {
      console.error('[Audio] Falha ao gerar narração da história', error);
    }
  }

  async ensurePageNarration(adaptationId: string, pageIndex: number) {
    const adaptation = await this.prisma.passageAdaptation.findUnique({
      where: { id: adaptationId },
    });
    if (!adaptation) throw new AdaptationNotFound();

    const parsed = adaptationContentSchema.parse(adaptation.content);
    const page = parsed.pages[pageIndex];
    if (!page) {
      throw new DomainError('VALIDATION_ERROR', 'Página da adaptação não encontrada.');
    }

    const storyText = extractStoryNarrationText(parsed);
    if (!storyText.fullText) {
      throw new DomainError('VALIDATION_ERROR', 'Esta história não tem texto para narrar.');
    }

    const pageRange = storyText.pages.find((item) => item.pageIndex === pageIndex);
    if (!pageRange) {
      throw new DomainError('VALIDATION_ERROR', 'Esta página não tem texto para narrar.');
    }

    const applied = this.applyStoredStoryNarration(parsed, storyText.pages, pageIndex);
    if (applied) {
      return applied;
    }

    if (!this.tts.generateSpeechWithTimestamps) {
      throw new DomainError(
        'TTS_NOT_CONFIGURED',
        'Narração com sincronização não está disponível neste provedor.'
      );
    }

    const existing = await this.prisma.audioAsset.findUnique({
      where: {
        adaptationId_blockKey: { adaptationId, blockKey: STORY_NARRATION_BLOCK_KEY },
      },
    });

    let relativePath = existing?.filePath;
    let durationMs = existing?.durationMs ?? undefined;
    let alignment = parsed.storyNarrationAlignment;

    if (!existing || !alignment) {
      const generated = await this.tts.generateSpeechWithTimestamps({
        text: storyText.fullText,
        blockKey: STORY_NARRATION_BLOCK_KEY,
      });

      if (!generated.alignment) {
        throw new DomainError('TTS_NOT_CONFIGURED', 'A narração foi gerada sem timestamps.');
      }

      const extension = extensionForContentType(generated.contentType);
      relativePath = `audio/${adaptationId}/${STORY_NARRATION_BLOCK_KEY}${extension}`;
      await this.storage.save(relativePath, generated.buffer, generated.contentType);
      durationMs = generated.durationMs;
      alignment = generated.alignment;

      if (!existing) {
        await this.prisma.audioAsset.create({
          data: {
            adaptationId,
            blockKey: STORY_NARRATION_BLOCK_KEY,
            filePath: relativePath,
            durationMs: generated.durationMs,
          },
        });
      }
    }

    const url = this.storage.getPublicUrl(relativePath!);
    const slices = sliceStoryAlignment(alignment, storyText.pages);
    const content = this.contentWithStoryNarration(parsed, url, alignment, slices);

    await this.prisma.passageAdaptation.update({
      where: { id: adaptationId },
      data: { content },
    });

    const current = slices.find((slice) => slice.pageIndex === pageIndex);
    if (!current) {
      throw new DomainError('VALIDATION_ERROR', 'Esta página não tem texto para narrar.');
    }

    return {
      url,
      alignment: current.alignment,
      startSeconds: current.startSeconds,
      endSeconds: current.endSeconds,
      durationMs,
      pages: slices,
    };
  }

  private applyStoredStoryNarration(
    parsed: AdaptationContent,
    pageRanges: ReturnType<typeof extractStoryNarrationText>['pages'],
    pageIndex: number
  ) {
    const sharedUrl = parsed.storyNarrationAudioPath;
    const fullAlignment = parsed.storyNarrationAlignment;
    if (!sharedUrl || !fullAlignment) return null;

    const slices = sliceStoryAlignment(fullAlignment, pageRanges);
    const current = slices.find((slice) => slice.pageIndex === pageIndex);
    if (!current) return null;

    return {
      url: sharedUrl,
      alignment: current.alignment,
      startSeconds: current.startSeconds,
      endSeconds: current.endSeconds,
      durationMs: undefined,
      pages: slices,
    };
  }

  private contentWithStoryNarration(
    parsed: AdaptationContent,
    url: string,
    alignment: AdaptationContent['storyNarrationAlignment'],
    slices: PageNarrationSlice[]
  ): AdaptationContent {
    const slicesByPage = new Map(slices.map((slice) => [slice.pageIndex, slice]));

    return {
      ...parsed,
      storyNarrationAudioPath: url,
      storyNarrationAlignment: alignment,
      pages: parsed.pages.map((currentPage, index) => {
        const slice = slicesByPage.get(index);
        if (!slice) return currentPage;
        return {
          ...currentPage,
          narrationAudioPath: url,
          narrationAlignment: slice.alignment,
          narrationStartSeconds: slice.startSeconds,
          narrationEndSeconds: slice.endSeconds,
        };
      }),
    };
  }
}
