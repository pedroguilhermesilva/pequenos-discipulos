'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPassageSourceVersesAction } from '@/lib/stories/library-actions';
import {
  type BiblePassage,
  type BibleVerseLine,
} from '@/lib/stories/bible-passages';
import { getBibleVersionLabel } from '@/lib/stories/bible-versions';
import { cn } from '@/lib/cn';

interface BiblePassageDialogProps {
  open: boolean;
  onClose: () => void;
  passage: BiblePassage;
  passageReference: string;
  verses?: BibleVerseLine[];
  verseFrom?: number;
  verseTo?: number;
  bibleVersionId?: string;
  loading?: boolean;
  sourceError?: string | null;
  adaptationNote?: string | null;
}

const SCROLL_TOP_THRESHOLD = 280;

function formatVerseCount(count: number): string {
  if (count === 1) return '1 versículo';
  return `${count} versículos`;
}

function BibleVerseText({ verses }: { verses: BibleVerseLine[] }) {
  return (
    <div className="divide-y divide-borda/40">
      {verses.map((verse, index) => (
        <article
          key={verse.number}
          id={index === 0 ? 'bible-passage-first-verse' : undefined}
          className="flex gap-3 py-3.5 sm:py-3 scroll-mt-2"
          aria-label={`Versículo ${verse.number}`}
        >
          <span
            className={cn(
              'shrink-0 w-9 sm:w-10 text-right font-display font-bold tabular-nums',
              'text-base sm:text-lg leading-snug text-laranja'
            )}
            aria-hidden="true"
          >
            {verse.number}
          </span>
          <p className="min-w-0 flex-1 font-story text-[0.9375rem] sm:text-base leading-relaxed text-tinta pt-0.5">
            {verse.text}
          </p>
        </article>
      ))}
    </div>
  );
}

const ADAPTATION_NOTE_TOOLTIP_TEXT =
  'Esta nota explica como a história adaptada para crianças foi criada — não se refere ao texto bíblico original mostrado acima.';

const TOOLTIP_WIDTH = 224;
const TOOLTIP_GAP = 6;
const TOOLTIP_ESTIMATED_HEIGHT = 72;

function AdaptationNoteInfoTooltip({ id }: { id: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom';
  } | null>(null);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement =
      spaceBelow < TOOLTIP_ESTIMATED_HEIGHT + TOOLTIP_GAP && spaceAbove >= spaceBelow
        ? 'top'
        : 'bottom';

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - TOOLTIP_WIDTH - 8));
    const top =
      placement === 'bottom' ? rect.bottom + TOOLTIP_GAP : rect.top - TOOLTIP_GAP;

    setCoords({ top, left, placement });
  }, []);

  const show = useCallback(() => {
    updatePosition();
    setOpen(true);
  }, [updatePosition]);

  const hide = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="rounded-full p-0.5 text-oliva/70 transition-colors hover:text-laranja focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
        aria-label="O que é a nota de adaptação?"
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <span className="material-symbols-outlined text-sm leading-none" aria-hidden="true">
          info
        </span>
      </button>
      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: TOOLTIP_WIDTH,
              transform: coords.placement === 'top' ? 'translateY(-100%)' : undefined,
              zIndex: 60,
            }}
            className="rounded-livro border border-borda bg-white px-3 py-2 text-xs font-normal normal-case leading-relaxed text-tinta shadow-livro"
          >
            {ADAPTATION_NOTE_TOOLTIP_TEXT}
          </span>,
          document.body
        )}
    </>
  );
}

export function BiblePassageDialog({
  open,
  onClose,
  passage,
  passageReference,
  verses: versesProp,
  verseFrom = 1,
  verseTo,
  bibleVersionId,
  loading: loadingProp = false,
  sourceError: sourceErrorProp,
  adaptationNote,
}: BiblePassageDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const adaptationNoteTooltipId = useId();
  const [resolvedVerses, setResolvedVerses] = useState<BibleVerseLine[]>(versesProp ?? []);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(sourceErrorProp ?? null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const translationLabel = getBibleVersionLabel(bibleVersionId ?? 'alm1911');
  const loading = loadingProp || fetchLoading;
  const verses = resolvedVerses;
  const errorMessage = fetchError;
  const verseCountLabel =
    verses.length > 0 ? formatVerseCount(verses.length) : null;

  const scrollToTop = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const first = container.querySelector<HTMLElement>('#bible-passage-first-verse');
    if (first) {
      first.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      return;
    }

    container.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, []);

  useEffect(() => {
    setResolvedVerses(versesProp ?? []);
  }, [versesProp]);

  useEffect(() => {
    setFetchError(sourceErrorProp ?? null);
  }, [sourceErrorProp]);

  useEffect(() => {
    if (!open) {
      setShowBackToTop(false);
    }
  }, [open]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!open || !container) return;

    const onScroll = () => {
      setShowBackToTop(container.scrollTop > SCROLL_TOP_THRESHOLD);
    };

    onScroll();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [open, loading, verses.length]);

  useEffect(() => {
    if (
      !open ||
      loadingProp ||
      (versesProp && versesProp.length > 0) ||
      resolvedVerses.length > 0
    ) {
      return;
    }

    const effectiveVerseTo = verseTo ?? passage.defaultVerseTo;
    let cancelled = false;

    async function loadVerses() {
      setFetchLoading(true);
      setFetchError(null);

      try {
        const result = await getPassageSourceVersesAction({
          passageSlug: passage.id,
          verseFrom,
          verseTo: effectiveVerseTo,
          bibleVersionId,
        });

        if (cancelled) return;

        if (!result.ok) {
          setFetchError(result.message);
          setResolvedVerses([]);
          return;
        }

        setResolvedVerses(result.data.verses);
      } finally {
        if (!cancelled) {
          setFetchLoading(false);
        }
      }
    }

    void loadVerses();
    return () => {
      cancelled = true;
    };
  }, [
    bibleVersionId,
    loadingProp,
    open,
    passage.defaultVerseTo,
    passage.id,
    verseFrom,
    verseTo,
    resolvedVerses.length,
    versesProp,
  ]);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const note =
    adaptationNote ??
    'O foco foi mantido na luz e na jornada, simplificando os conflitos políticos para a faixa etária selecionada.';

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center bg-tinta/60 backdrop-blur-sm',
        'items-end p-0 sm:items-center sm:p-4',
        'pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bible-passage-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className={cn(
          'relative flex w-full flex-col bg-white shadow-2xl border border-borda animate-fade-in',
          'max-sm:max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]',
          'max-sm:min-h-[min(88dvh,100%)] max-sm:rounded-t-livro-xl',
          'sm:max-h-[min(85dvh,720px)] sm:max-w-2xl sm:rounded-livro-xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-borda bg-white px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <div className="shrink-0 rounded-livro bg-pergaminho-escuro p-2 text-oliva">
                <span className="material-symbols-outlined text-xl">history_edu</span>
              </div>
              <div className="min-w-0">
                <h3 id="bible-passage-title" className="font-display font-bold text-tinta">
                  Passagem bíblica
                </h3>
                <p className="mt-0.5 text-xs font-bold italic text-laranja">{passageReference}</p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="shrink-0 rounded p-1 text-oliva transition-colors hover:text-tinta focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-borda/60 pt-3">
            <p className="text-xs text-oliva/90">
              Tradução: <span className="font-medium text-tinta">{translationLabel}</span>
            </p>
            {verseCountLabel && !loading && !errorMessage ? (
              <p
                className="text-xs font-semibold tabular-nums text-oliva"
                aria-live="polite"
              >
                {verseCountLabel}
              </p>
            ) : null}
          </div>
        </header>

        <div
          ref={scrollRef}
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6"
        >
          {loading ? (
            <p className="text-sm text-oliva/80">Carregando texto bíblico...</p>
          ) : errorMessage ? (
            <div
              role="alert"
              className="rounded-livro border border-borda bg-pergaminho-escuro/40 px-4 py-3 text-sm text-tinta"
            >
              {errorMessage}
            </div>
          ) : verses.length > 0 ? (
            <BibleVerseText verses={verses} />
          ) : (
            <div
              role="alert"
              className="rounded-livro border border-borda bg-pergaminho-escuro/40 px-4 py-3 text-sm text-tinta"
            >
              Não foi possível carregar o texto bíblico desta passagem.
            </div>
          )}

          {!loading && (
            <div className="mt-6 p-4 bg-pergaminho-escuro/50 rounded-livro border border-borda">
              <div className="mb-2 flex items-center gap-1">
                <p className="text-[10px] font-bold text-oliva uppercase tracking-wider">
                  Nota de adaptação
                </p>
                <AdaptationNoteInfoTooltip id={adaptationNoteTooltipId} />
              </div>
              <p className="text-xs text-oliva leading-relaxed">{note}</p>
            </div>
          )}
        </div>

        {showBackToTop && verses.length > 0 && !loading ? (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Voltar ao topo da passagem"
            className={cn(
              'absolute z-10 flex items-center gap-1.5 rounded-full border border-borda bg-white/95 px-3 py-2.5',
              'text-xs font-bold text-laranja shadow-livro backdrop-blur-sm',
              'transition-all hover:border-laranja/40 hover:bg-pergaminho-escuro/80',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
              'right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:right-6 sm:bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]'
            )}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              keyboard_arrow_up
            </span>
            Topo
          </button>
        ) : null}

        <footer className="shrink-0 border-t border-borda bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'w-full py-2.5 rounded-xl bg-gradient-to-r from-amber to-laranja',
              'hover:from-amber/90 hover:to-laranja/90 font-bold text-xs text-white transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2'
            )}
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
