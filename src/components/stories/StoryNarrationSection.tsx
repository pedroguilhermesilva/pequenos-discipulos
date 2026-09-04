'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdaptationContent, NarrationAlignment } from '@/lib/domain/schemas';
import { cn } from '@/lib/cn';
import {
  alignmentToWords,
  findActiveWordIndex,
} from '@/lib/stories/narration-alignment';
import { extractPagePlainText } from '@/lib/stories/page-plain-text';

type PageNarrationPatch = {
  pageIndex: number;
  alignment: NarrationAlignment;
  startSeconds: number;
  endSeconds: number;
};

interface StoryNarrationSectionProps {
  adaptationId: string;
  pageIndex: number;
  content: AdaptationContent;
  onPageChange?: (pageIndex: number) => void;
  onNarrationReady?: (patch: {
    storyNarrationAudioPath: string;
    storyNarrationAlignment?: NarrationAlignment;
    pages: PageNarrationPatch[];
  }) => void;
}

export function StoryNarrationSection({
  adaptationId,
  pageIndex,
  content,
  onPageChange,
  onNarrationReady,
}: StoryNarrationSectionProps) {
  const page = content.pages[pageIndex];
  const lastPageIndex = Math.max(0, content.pages.length - 1);
  const plainText = useMemo(
    () => extractPagePlainText(content, pageIndex),
    [content, pageIndex]
  );

  const hasStoryNarration = Boolean(content.storyNarrationAudioPath);
  const [audioUrl, setAudioUrl] = useState(content.storyNarrationAudioPath ?? '');
  const [alignment, setAlignment] = useState<NarrationAlignment | undefined>(
    hasStoryNarration ? page?.narrationAlignment : undefined
  );
  const [pageStart, setPageStart] = useState(
    hasStoryNarration ? page?.narrationStartSeconds : undefined
  );
  const [pageEnd, setPageEnd] = useState(hasStoryNarration ? page?.narrationEndSeconds : undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pageIndexRef = useRef(pageIndex);
  const pageStartRef = useRef(pageStart);
  const pageEndRef = useRef(pageEnd);
  const lastPageIndexRef = useRef(lastPageIndex);
  const onPageChangeRef = useRef(onPageChange);
  const playbackCursorRef = useRef(0);

  const pageBounds = useMemo(() => {
    const slice = content.pages[pageIndex];
    const nextStart = content.pages[pageIndex + 1]?.narrationStartSeconds;
    const start = slice?.narrationStartSeconds;
    const end = nextStart ?? slice?.narrationEndSeconds;
    return { start, end };
  }, [content.pages, pageIndex]);

  const words = useMemo(
    () => (alignment ? alignmentToWords(alignment) : []),
    [alignment]
  );
  const displayWords = useMemo(
    () => plainText.split(/\s+/).filter(Boolean),
    [plainText]
  );
  const startSeconds = pageBounds.start ?? pageStart ?? words[0]?.start ?? 0;
  const endSeconds = pageBounds.end ?? pageEnd ?? words[words.length - 1]?.end;
  const timedActiveIndex = findActiveWordIndex(words, currentTime);
  const activeWordIndex =
    timedActiveIndex >= 0 && timedActiveIndex < displayWords.length
      ? timedActiveIndex
      : -1;

  pageIndexRef.current = pageIndex;
  pageStartRef.current = startSeconds;
  pageEndRef.current = endSeconds;
  lastPageIndexRef.current = lastPageIndex;
  onPageChangeRef.current = onPageChange;

  useEffect(() => {
    if (!content.storyNarrationAudioPath) return;
    setAudioUrl(content.storyNarrationAudioPath);
    setAlignment(page?.narrationAlignment);
    setPageStart(page?.narrationStartSeconds);
    setPageEnd(page?.narrationEndSeconds);
  }, [
    content.storyNarrationAudioPath,
    page?.narrationAlignment,
    page?.narrationEndSeconds,
    page?.narrationStartSeconds,
    pageIndex,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    const sliceStart = pageBounds.start;
    const sliceEnd = pageBounds.end;
    if (!audio || sliceStart == null || sliceEnd == null) return;

    const time = audio.currentTime;
    const withinPage = time >= sliceStart - 0.12 && time < sliceEnd;
    if (!withinPage) {
      audio.currentTime = sliceStart;
      playbackCursorRef.current = sliceStart;
      setCurrentTime(sliceStart);
    }
  }, [pageBounds.end, pageBounds.start, pageIndex]);

  const bindAudio = useCallback((audio: HTMLAudioElement) => {
    audio.ontimeupdate = () => {
      const time = audio.currentTime;
      const previousTime = playbackCursorRef.current;
      playbackCursorRef.current = time;
      setCurrentTime(time);
      const start = pageStartRef.current ?? 0;
      const end = pageEndRef.current;
      const index = pageIndexRef.current;
      const last = lastPageIndexRef.current;
      const crossedPageEnd =
        end != null &&
        previousTime >= start - 0.12 &&
        previousTime < end &&
        time >= end;
      if (crossedPageEnd) {
        if (index < last) {
          onPageChangeRef.current?.(index + 1);
        } else if (!audio.paused) {
          audio.pause();
          setIsPlaying(false);
        }
      }
    };
    audio.onended = () => {
      setIsPlaying(false);
    };
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
  }, []);

  const resolveAudioElement = useCallback(
    (url: string) => {
      const existing = audioRef.current;
      const nextSrc = new URL(url, window.location.origin).href;
      if (existing) {
        if (existing.src !== nextSrc) {
          existing.src = url;
        }
        bindAudio(existing);
        return existing;
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      bindAudio(audio);
      return audio;
    },
    [bindAudio]
  );

  const ensureNarration = useCallback(async () => {
    const storyAudioUrl = content.storyNarrationAudioPath ?? audioUrl;
    if (storyAudioUrl && content.storyNarrationAudioPath && alignment && endSeconds != null) {
      return {
        url: storyAudioUrl,
        alignment,
        startSeconds,
        endSeconds,
      };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/audio/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adaptationId, pageIndex }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message?: string;
        data?: {
          url: string;
          alignment: NarrationAlignment;
          startSeconds: number;
          endSeconds: number;
          pages: PageNarrationPatch[];
        };
      };

      if (!json.ok || !json.data) {
        throw new Error(json.message ?? 'Não foi possível gerar a narração.');
      }

      setAudioUrl(json.data.url);
      setAlignment(json.data.alignment);
      setPageStart(json.data.startSeconds);
      setPageEnd(json.data.endSeconds);
      onNarrationReady?.({
        storyNarrationAudioPath: json.data.url,
        pages: json.data.pages,
      });

      return json.data;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Não foi possível gerar a narração.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    adaptationId,
    alignment,
    audioUrl,
    content.storyNarrationAudioPath,
    endSeconds,
    onNarrationReady,
    pageIndex,
    startSeconds,
  ]);

  const togglePlayback = useCallback(async () => {
    const narration = await ensureNarration();
    if (!narration) return;

    const audio = resolveAudioElement(narration.url);
    const start = narration.startSeconds;
    const end = narration.endSeconds;
    const time = audio.currentTime;
    const withinPage = time >= start - 0.12 && time < end;

    if (isPlaying) {
      audio.pause();
      return;
    }

    if (!withinPage) {
      audio.currentTime = start;
      playbackCursorRef.current = start;
      setCurrentTime(start);
    }

    try {
      await audio.play();
    } catch {
      setError('Não foi possível reproduzir a narração neste navegador.');
    }
  }, [ensureNarration, isPlaying, resolveAudioElement]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  if (!page) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-livro-xl border border-borda bg-pergaminho-escuro/40 p-4 md:p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => void togglePlayback()}
            disabled={loading}
            className="w-14 h-14 rounded-full bg-laranja text-white flex items-center justify-center shadow-livro hover:scale-105 transition disabled:opacity-60"
            aria-label={isPlaying ? 'Pausar narração' : 'Ouvir narração da página'}
          >
            <span className="material-symbols-outlined text-3xl">
              {loading ? 'hourglass_top' : isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-tinta">Narração da página</p>
            <p className="text-sm text-oliva">
              {loading
                ? 'Gerando narração da história...'
                : 'Toque para ouvir. Ao mudar de página, a narração acompanha o texto.'}
            </p>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-laranja font-medium">{error}</p>}
      </div>

      <div className="font-story text-lg md:text-xl leading-relaxed text-tinta">
        {displayWords.length > 0 ? (
          <p>
            {displayWords.map((word, index) => (
              <span key={`${word}-${index}`}>
                <span
                  className={cn(
                    'rounded-sm [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
                    index === activeWordIndex ? 'bg-laranja/25' : 'bg-transparent'
                  )}
                >
                  {word}
                </span>
                {index < displayWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-oliva">{plainText}</p>
        )}
      </div>
    </div>
  );
}
