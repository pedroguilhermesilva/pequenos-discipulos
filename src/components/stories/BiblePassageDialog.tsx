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

function BibleVerseText({ verses }: { verses: BibleVerseLine[] }) {
  return (
    <div className="space-y-3 font-story text-sm leading-relaxed text-tinta">
      {verses.map((verse) => (
        <p key={verse.number}>
          <sup
            className="mr-1 text-[0.7em] font-bold text-laranja align-super not-italic"
            aria-label={`Versículo ${verse.number}`}
          >
            {verse.number}
          </sup>
          {verse.text}
        </p>
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const adaptationNoteTooltipId = useId();
  const [resolvedVerses, setResolvedVerses] = useState<BibleVerseLine[]>(versesProp ?? []);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(sourceErrorProp ?? null);

  const translationLabel = getBibleVersionLabel(bibleVersionId ?? 'alm1911');
  const loading = loadingProp || fetchLoading;
  const verses = resolvedVerses;
  const errorMessage = fetchError;

  useEffect(() => {
    setResolvedVerses(versesProp ?? []);
  }, [versesProp]);

  useEffect(() => {
    setFetchError(sourceErrorProp ?? null);
  }, [sourceErrorProp]);

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
      className="fixed inset-0 bg-tinta/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bible-passage-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-t-livro-xl sm:rounded-livro-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-borda animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-borda px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-pergaminho-escuro text-oliva rounded-livro">
              <span className="material-symbols-outlined text-xl">history_edu</span>
            </div>
            <div>
              <h3 id="bible-passage-title" className="font-display font-bold text-tinta">
                Passagem bíblica
              </h3>
              <p className="text-xs font-bold text-laranja italic">{passageReference}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-oliva hover:text-tinta transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded p-1"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
          <p className="mb-4 text-xs text-oliva/80">Tradução: {translationLabel}</p>

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
            <div className="mt-5 p-4 bg-pergaminho-escuro/50 rounded-livro border border-borda">
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

        <div className="border-t border-borda px-5 py-4 shrink-0">
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
        </div>
      </div>
    </div>
  );
}
