'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import type { ContentType } from '@/lib/stories/types';
import { contentTypeConfig } from '@/lib/stories/content-type';
import type { AgeTier } from '@/lib/stories/age-tiers';
import { getAgeTierFromPreferences } from '@/lib/stories/age-tiers';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import type { UserPreferences } from '@/lib/onboarding/types';
import { FRIENDLY_GENERATION_ERROR } from '@/lib/domain/errors';
import {
  readStoryGenerationResponse,
  type StoryGenerationData,
  type StoryGenerationOutcome,
} from '@/lib/stories/request-story-generation';

const inFlightGenerations = new Map<string, Promise<StoryGenerationOutcome>>();

function generationRequestKey(
  passageSlug: string,
  verseFrom: number,
  verseTo: number,
  contentType: ContentType,
  ageTier: AgeTier,
  prefs: UserPreferences,
  mode: 'initial' | 'regenerate',
  currentAdaptationId: string | undefined,
  idempotencyKey: string
) {
  return [
    passageSlug,
    verseFrom,
    verseTo,
    contentType,
    ageTier,
    prefs.bibleVersionId,
    prefs.languageStyle,
    mode,
    currentAdaptationId ?? '',
    idempotencyKey,
  ].join('|');
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface StoryGeneratingProps {
  contentType: ContentType;
  storyTitle: string;
  passageSlug: string;
  verseFrom: number;
  verseTo: number;
  preferences?: UserPreferences | null;
  childProfileId?: string;
  mode?: 'initial' | 'regenerate';
  currentAdaptationId?: string;
  onComplete: (result: StoryGenerationData) => void;
  onError?: (message: string) => void;
}

export function StoryGenerating({
  contentType,
  storyTitle,
  passageSlug,
  verseFrom,
  verseTo,
  preferences,
  childProfileId,
  mode = 'initial',
  currentAdaptationId,
  onComplete,
  onError,
}: StoryGeneratingProps) {
  const config = contentTypeConfig[contentType];
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Uma chave por tentativa: re-renders e remounts do StrictMode reutilizam-na (sem geração
  // duplicada); "Tentar novamente" cria uma nova (o servidor também liberta a reserva falhada).
  const idempotencyKeyRef = useRef<{ attempt: number; key: string } | null>(null);

  // Callbacks em refs: uma nova identidade de função no pai não deve disparar outro pedido.
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const prefs: UserPreferences = { ...DEFAULT_PREFERENCES, ...preferences };
  const ageTier: AgeTier = getAgeTierFromPreferences(prefs);
  const bibleVersionId = prefs.bibleVersionId;
  const languageStyle = prefs.languageStyle;

  useEffect(() => {
    let cancelled = false;
    if (idempotencyKeyRef.current?.attempt !== attempt) {
      idempotencyKeyRef.current = { attempt, key: createIdempotencyKey() };
    }
    const idempotencyKey = idempotencyKeyRef.current.key;

    async function run() {
      try {
        const requestKey = generationRequestKey(
          passageSlug,
          verseFrom,
          verseTo,
          contentType,
          ageTier,
          { ...DEFAULT_PREFERENCES, bibleVersionId, languageStyle },
          mode,
          currentAdaptationId,
          idempotencyKey
        );
        let pending = inFlightGenerations.get(requestKey);
        if (!pending) {
          pending = fetch('/api/stories/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              passageSlug,
              bibleVersionId,
              verseFrom,
              verseTo,
              ageTier,
              languageStyle,
              contentType,
              childProfileId,
              mode,
              currentAdaptationId,
              idempotencyKey,
            }),
          })
            .then(readStoryGenerationResponse)
            .finally(() => {
              inFlightGenerations.delete(requestKey);
            });
          inFlightGenerations.set(requestKey, pending);
        }

        const outcome = await pending;
        if (cancelled) return;

        if (!outcome.ok) {
          setError({ message: outcome.message, retryable: outcome.retryable });
          onErrorRef.current?.(outcome.message);
          return;
        }

        onCompleteRef.current(outcome.data);
      } catch {
        if (cancelled) return;
        const message = FRIENDLY_GENERATION_ERROR;
        setError({ message, retryable: true });
        onErrorRef.current?.(message);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    attempt,
    ageTier,
    bibleVersionId,
    childProfileId,
    contentType,
    currentAdaptationId,
    languageStyle,
    mode,
    passageSlug,
    verseFrom,
    verseTo,
  ]);

  function handleRetry() {
    setError(null);
    setAttempt((value) => value + 1);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in px-4">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-vida/10 flex items-center justify-center">
          <span
            className={`material-symbols-outlined text-5xl ${error ? 'text-oliva' : 'text-vida animate-shimmer'}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {error ? 'sentiment_dissatisfied' : config.icon}
          </span>
        </div>
        {!error && (
          <div className="absolute -inset-2 rounded-full border-2 border-vida/20 border-t-vida animate-spin" />
        )}
      </div>

      <h2 className="font-display text-2xl md:text-3xl font-bold text-tinta mb-3">
        {error
          ? 'Não foi possível criar'
          : mode === 'regenerate'
            ? 'Gerando nova versão...'
            : 'Criando sua história...'}
      </h2>
      <p className="text-oliva text-lg max-w-md mb-6">
        {error ? (
          error.message
        ) : mode === 'regenerate' ? (
          <>
            Buscando outra adaptação de <strong className="text-tinta">{storyTitle}</strong> antes de
            chamar a IA — mesma experiência de espera, versão diferente.
          </>
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

      {error && (
        <div className="flex flex-col sm:flex-row items-center gap-3" role="alert">
          {error.retryable && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-vida text-white font-bold hover:bg-vida/90 transition"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
              Tentar novamente
            </button>
          )}
          <Link
            href="/nova-historia"
            className="px-6 py-3 rounded-xl text-oliva font-bold bg-pergaminho-escuro hover:bg-pergaminho-escuro/80 transition"
          >
            Escolher outra passagem
          </Link>
        </div>
      )}
    </div>
  );
}
