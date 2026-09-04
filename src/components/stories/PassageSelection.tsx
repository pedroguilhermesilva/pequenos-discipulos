'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  findPassageId,
  formatChapterReference,
  getBooksByTestament,
  getChapterOption,
  getChapters,
  getPassageById,
  getSelectionFromPassageId,
  getVerseSpan,
  MAX_VERSE_SPAN,
  suggestedPassages,
  validateVerseRange,
  type PassageRange,
} from '@/lib/stories/bible-passages';
import { buildStoryUrl } from '@/lib/stories/story-url';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { cn } from '@/lib/cn';

interface PassageSelectionProps {
  storyId: string;
  storyTitle: string;
  suggestedPassageId?: string;
  backHref?: string;
}

const selectClassName = cn(
  'w-full px-4 py-3 rounded-xl border border-borda bg-white text-tinta font-semibold',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
  'appearance-none bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat',
  'pr-10'
);

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
};

function getInitialState(suggestedPassageId?: string) {
  const suggested = suggestedPassageId ? getSelectionFromPassageId(suggestedPassageId) : null;

  if (suggested) {
    return {
      bookId: suggested.bookId,
      chapter: suggested.chapter,
      verseFrom: suggested.verseFrom,
      verseTo: suggested.verseTo,
    };
  }

  const oldTestament = getBooksByTestament('old');
  const mateus = getBooksByTestament('new').find((b) => b.id === 'mateus');
  const firstBook = mateus ?? oldTestament[0];
  const firstChapter = firstBook ? getChapters(firstBook.id)[0] : undefined;

  return {
    bookId: firstBook?.id ?? '',
    chapter: firstChapter?.chapter ?? 1,
    verseFrom: firstChapter?.defaultVerseFrom ?? 1,
    verseTo: firstChapter?.defaultVerseTo ?? 1,
  };
}

export function PassageSelection({
  storyId,
  storyTitle,
  suggestedPassageId,
  backHref = '/biblioteca',
}: PassageSelectionProps) {
  const router = useRouter();
  const oldTestamentBooks = useMemo(() => getBooksByTestament('old'), []);
  const newTestamentBooks = useMemo(() => getBooksByTestament('new'), []);
  const initial = useMemo(() => getInitialState(suggestedPassageId), [suggestedPassageId]);

  const [bookId, setBookId] = useState(initial.bookId);
  const [chapter, setChapter] = useState(initial.chapter);
  const [verseFrom, setVerseFrom] = useState(initial.verseFrom);
  const [verseTo, setVerseTo] = useState(initial.verseTo);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(
    suggestedPassageId ?? null
  );

  const chapters = useMemo(() => getChapters(bookId), [bookId]);
  const chapterOption = getChapterOption(bookId, chapter);
  const selectedBook = [...oldTestamentBooks, ...newTestamentBooks].find((b) => b.id === bookId);
  const suggestedSelection = suggestedPassageId
    ? getSelectionFromPassageId(suggestedPassageId)
    : null;
  const suggestedPassage = suggestedPassageId ? getPassageById(suggestedPassageId) : undefined;

  const verseOptions = useMemo(() => {
    const max = chapterOption?.maxVerse ?? 1;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [chapterOption]);

  const ateOptions = useMemo(
    () => verseOptions.filter((v) => v >= verseFrom),
    [verseOptions, verseFrom]
  );

  const currentRange: PassageRange = { verseFrom, verseTo };
  const verseSpan = getVerseSpan(currentRange);

  const previewReference = useMemo(() => {
    if (!selectedBook) return '';
    return formatChapterReference(selectedBook.name, chapter, currentRange);
  }, [selectedBook, chapter, verseFrom, verseTo]);

  useEffect(() => {
    if (!bookId) return;
    const available = getChapters(bookId);
    if (!available.some((c) => c.chapter === chapter)) {
      const first = available[0];
      if (first) {
        setChapter(first.chapter);
        setVerseFrom(first.defaultVerseFrom);
        setVerseTo(first.defaultVerseTo);
      }
    }
  }, [bookId, chapter]);

  useEffect(() => {
    if (!chapterOption) return;
    if (verseFrom > chapterOption.maxVerse) {
      setVerseFrom(chapterOption.defaultVerseFrom);
    }
    if (verseTo > chapterOption.maxVerse) {
      setVerseTo(chapterOption.defaultVerseTo);
    }
    if (verseTo < verseFrom) {
      setVerseTo(verseFrom);
    }
    if (verseTo - verseFrom + 1 > MAX_VERSE_SPAN) {
      setVerseTo(Math.min(verseFrom + MAX_VERSE_SPAN - 1, chapterOption.maxVerse));
    }
  }, [chapterOption, verseFrom, verseTo]);

  const handleBookChange = (newBookId: string) => {
    const newChapters = getChapters(newBookId);
    const first = newChapters[0];
    setBookId(newBookId);
    setActiveSuggestionId(null);
    if (first) {
      setChapter(first.chapter);
      setVerseFrom(first.defaultVerseFrom);
      setVerseTo(first.defaultVerseTo);
    }
    setRangeError(null);
  };

  const handleChapterChange = (newChapter: number) => {
    const option = getChapterOption(bookId, newChapter);
    setChapter(newChapter);
    setActiveSuggestionId(null);
    if (option) {
      setVerseFrom(option.defaultVerseFrom);
      setVerseTo(option.defaultVerseTo);
    }
    setRangeError(null);
  };

  const handleVerseFromChange = (value: number) => {
    setVerseFrom(value);
    setActiveSuggestionId(null);
    const maxTo = Math.min(value + MAX_VERSE_SPAN - 1, chapterOption?.maxVerse ?? value);
    if (verseTo < value) setVerseTo(value);
    else if (verseTo > maxTo) setVerseTo(maxTo);
    setRangeError(null);
  };

  const handleVerseToChange = (value: number) => {
    setVerseTo(value);
    setActiveSuggestionId(null);
    setRangeError(null);
  };

  const applySuggestedPassage = (passageId: string) => {
    const selection = getSelectionFromPassageId(passageId);
    if (!selection) return;
    setBookId(selection.bookId);
    setChapter(selection.chapter);
    setVerseFrom(selection.verseFrom);
    setVerseTo(selection.verseTo);
    setActiveSuggestionId(passageId);
    setRangeError(null);
  };

  const handleContinue = () => {
    const passageId = findPassageId(bookId, chapter);
    if (!passageId) {
      setRangeError('Selecione um livro e capítulo válidos');
      return;
    }

    const range: PassageRange = { verseFrom, verseTo };
    const error = validateVerseRange(bookId, chapter, range);
    if (error) {
      setRangeError(error);
      return;
    }

    router.push(
      buildStoryUrl(storyId, {
        passageId,
        verseFrom: range.verseFrom,
        verseTo: range.verseTo,
      })
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="space-y-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-oliva hover:text-tinta transition-colors font-semibold text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded mb-4"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar
        </Link>
        <p className="text-oliva text-sm font-semibold uppercase tracking-widest">Passo 1 de 2</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta">
          Escolha a passagem bíblica
        </h1>
        <p className="text-oliva text-lg max-w-2xl">
          Selecione os versículos que deseja adaptar para{' '}
          <strong className="text-tinta">{storyTitle}</strong>.
        </p>
      </header>

      {/* Suggested passages */}
      <section aria-labelledby="suggestions-heading" className="space-y-3">
        <h2
          id="suggestions-heading"
          className="font-display font-bold text-tinta flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-dourado" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
          Passagens sugeridas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestedPassages.map((passage) => {
            const isActive = activeSuggestionId === passage.id;
            return (
              <button
                key={passage.id}
                type="button"
                onClick={() => applySuggestedPassage(passage.id)}
                className={cn(
                  'text-left p-4 rounded-livro border-2 transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2',
                  isActive
                    ? 'border-laranja bg-laranja-suave shadow-livro'
                    : 'border-borda bg-white hover:border-laranja/40 hover:shadow-livro'
                )}
              >
                <p className="text-xs font-bold text-laranja uppercase tracking-wider mb-1">
                  {passage.reference}
                </p>
                <p className="font-display font-bold text-tinta text-sm leading-snug mb-1">
                  {passage.book}
                </p>
                <p className="text-xs text-oliva leading-relaxed line-clamp-2">{passage.preview}</p>
              </button>
            );
          })}
        </div>
      </section>

      {suggestedPassage && suggestedSelection && !activeSuggestionId && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-oliva">
          <span className="material-symbols-outlined text-dourado text-base">history_edu</span>
          <span>Sugestão da história:</span>
          <button
            type="button"
            onClick={() => applySuggestedPassage(suggestedPassageId!)}
            className="font-semibold text-laranja hover:text-laranja/80 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded"
          >
            {suggestedPassage.reference}
          </button>
        </div>
      )}

      <div className="bg-white rounded-livro border border-borda shadow-livro p-6 md:p-8 space-y-5 max-w-xl">
        <p className="text-xs font-bold text-oliva uppercase tracking-wider">
          Ou escolha manualmente
        </p>

        <div className="space-y-2">
          <label htmlFor="passage-book" className="block text-xs font-bold text-oliva uppercase tracking-wider">
            Livro
          </label>
          <select
            id="passage-book"
            value={bookId}
            onChange={(e) => handleBookChange(e.target.value)}
            className={selectClassName}
            style={selectStyle}
          >
            <optgroup label="Antigo Testamento">
              {oldTestamentBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Novo Testamento">
              {newTestamentBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="passage-chapter"
            className="block text-xs font-bold text-oliva uppercase tracking-wider"
          >
            Capítulo
          </label>
          <select
            id="passage-chapter"
            value={chapter}
            onChange={(e) => handleChapterChange(parseInt(e.target.value, 10))}
            className={selectClassName}
            style={selectStyle}
          >
            {chapters.map((c) => (
              <option key={c.chapter} value={c.chapter}>
                Capítulo {c.chapter}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label
              htmlFor="passage-verse-from"
              className="block text-xs font-bold text-oliva uppercase tracking-wider"
            >
              De:
            </label>
            <select
              id="passage-verse-from"
              value={verseFrom}
              onChange={(e) => handleVerseFromChange(parseInt(e.target.value, 10))}
              className={selectClassName}
              style={selectStyle}
            >
              {verseOptions.map((v) => (
                <option key={v} value={v}>
                  Versículo {v}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="passage-verse-to"
              className="block text-xs font-bold text-oliva uppercase tracking-wider"
            >
              Até:
            </label>
            <select
              id="passage-verse-to"
              value={verseTo}
              onChange={(e) => handleVerseToChange(parseInt(e.target.value, 10))}
              className={selectClassName}
              style={selectStyle}
            >
              {ateOptions
                .filter((v) => v <= verseFrom + MAX_VERSE_SPAN - 1)
                .map((v) => (
                  <option key={v} value={v}>
                    Versículo {v}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-oliva">
          Máximo de {MAX_VERSE_SPAN} versículos por história
          {verseSpan > 0 && (
            <span className={cn('ml-1', verseSpan > MAX_VERSE_SPAN && 'text-laranja font-semibold')}>
              · {verseSpan} selecionado{verseSpan !== 1 ? 's' : ''}
            </span>
          )}
        </p>

        {previewReference && (
          <div className="pt-4 border-t border-borda space-y-2">
            <p className="text-xs font-bold text-oliva uppercase tracking-wider">Prévia</p>
            <p className="font-display text-xl font-bold text-laranja">{previewReference}</p>
            {chapterOption?.preview && (
              <p className="text-sm text-oliva leading-relaxed">{chapterOption.preview}</p>
            )}
          </div>
        )}

        {rangeError && (
          <p className="text-sm text-laranja font-semibold" role="alert">
            {rangeError}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton
          onClick={handleContinue}
          disabled={!bookId || !chapterOption}
          icon={<span className="material-symbols-outlined">arrow_forward</span>}
        >
          Continuar
        </PrimaryButton>
      </div>
    </div>
  );
}
