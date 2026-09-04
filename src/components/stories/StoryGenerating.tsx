'use client';

import React, { useEffect, useState } from 'react';
import type { ContentType } from '@/lib/stories/types';
import { contentTypeConfig } from '@/lib/stories/content-type';
import type { AgeTier } from '@/lib/stories/age-tiers';
import { getAgeTierFromPreferences } from '@/lib/stories/age-tiers';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import type { UserPreferences } from '@/lib/onboarding/types';

type GenerationApiResult = {
  ok: boolean;
  message?: string;
  data?: { userStoryId: string; adaptationId: string; title: string };
};

const inFlightGenerations = new Map<string, Promise<GenerationApiResult>>();

function generationRequestKey(
  passageSlug: string,
  verseFrom: number,
  verseTo: number,
  contentType: ContentType,
  ageTier: AgeTier,
  prefs: UserPreferences
) {
  return [
    passageSlug,
    verseFrom,
    verseTo,
    contentType,
    ageTier,
    prefs.bibleVersionId,
    prefs.languageStyle,
  ].join('|');
}

interface StoryGeneratingProps {
  contentType: ContentType;
  storyTitle: string;
  passageSlug: string;
  verseFrom: number;
  verseTo: number;
  preferences?: UserPreferences | null;
  onComplete: (result: { userStoryId: string; adaptationId: string; title: string }) => void;
  onError?: (message: string) => void;
}

export function StoryGenerating({
  contentType,
  storyTitle,
  passageSlug,
  verseFrom,
  verseTo,
  preferences,
  onComplete,
  onError,
}: StoryGeneratingProps) {
  const config = contentTypeConfig[contentType];
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const prefs: UserPreferences = { ...DEFAULT_PREFERENCES, ...preferences };
    const ageTier: AgeTier = getAgeTierFromPreferences(prefs);

    async function run() {
      try {
        const requestKey = generationRequestKey(
          passageSlug,
          verseFrom,
          verseTo,
          contentType,
          ageTier,
          prefs
        );
        let pending = inFlightGenerations.get(requestKey);
        if (!pending) {
          pending = fetch('/api/stories/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              passageSlug,
              bibleVersionId: prefs.bibleVersionId,
              verseFrom,
              verseTo,
              ageTier,
              languageStyle: prefs.languageStyle,
              contentType,
            }),
          })
            .then((response) => response.json() as Promise<GenerationApiResult>)
            .finally(() => {
              inFlightGenerations.delete(requestKey);
            });
          inFlightGenerations.set(requestKey, pending);
        }

        const json = await pending;

        if (cancelled) return;

        if (!json.ok || !json.data) {
          const message = json.message ?? 'Não foi possível gerar a história.';
          setError(message);
          onError?.(message);
          return;
        }

        onComplete(json.data);
      } catch {
        if (cancelled) return;
        const message = 'Erro de rede ao gerar a história.';
        setError(message);
        onError?.(message);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    contentType,
    onComplete,
    onError,
    passageSlug,
    preferences,
    verseFrom,
    verseTo,
  ]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in px-4">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-vida/10 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-vida text-5xl animate-shimmer"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {config.icon}
          </span>
        </div>
        <div className="absolute -inset-2 rounded-full border-2 border-vida/20 border-t-vida animate-spin" />
      </div>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-tinta mb-3">
        {error ? 'Não foi possível criar' : 'Criando sua história...'}
      </h2>
      <p className="text-oliva text-lg max-w-md mb-6">
        {error ? (
          error
        ) : (
          <>
            Adaptando <strong className="text-tinta">{storyTitle}</strong> em formato{' '}
            <strong className="text-tinta">{config.label.toLowerCase()}</strong> e gerando todos os
            sons para o seu pequeno.
          </>
        )}
      </p>

      {!error && (
        <div className="w-full max-w-xs h-2 bg-borda/60 rounded-full overflow-hidden">
          <div className="h-full bg-vida rounded-full animate-[shimmer_2s_ease-in-out_infinite] w-2/3" />
        </div>
      )}
    </div>
  );
}
