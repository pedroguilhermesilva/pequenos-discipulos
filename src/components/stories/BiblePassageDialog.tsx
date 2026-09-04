'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  chunkBibleVerses,
  toBibleVerseLines,
  type BiblePassage,
  type BibleVerseLine,
} from '@/lib/stories/bible-passages';
import { cn } from '@/lib/cn';

interface BiblePassageDialogProps {
  open: boolean;
  onClose: () => void;
  passage: BiblePassage;
  passageReference: string;
  verses?: BibleVerseLine[];
  verseFrom?: number;
  loading?: boolean;
  adaptationNote?: string | null;
}

function BibleVerseText({ verses }: { verses: BibleVerseLine[] }) {
  return (
    <p className="text-sm text-tinta leading-relaxed font-story">
      {verses.map((verse) => (
        <span key={verse.number} className="inline">
          <sup
            className="mr-0.5 text-[0.7em] font-bold text-laranja align-super not-italic"
            aria-label={`Versículo ${verse.number}`}
          >
            {verse.number}
          </sup>
          {verse.text}{' '}
        </span>
      ))}
    </p>
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
  loading = false,
  adaptationNote,
}: BiblePassageDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const adaptationNoteTooltipId = useId();
  const [currentPage, setCurrentPage] = useState(1);

  const verses = useMemo(() => {
    if (versesProp && versesProp.length > 0) return versesProp;
    if (passage.verses.length > 0) {
      return toBibleVerseLines(passage.verses, verseFrom);
    }
    return [];
  }, [passage.verses, versesProp, verseFrom]);

  const pages = useMemo(() => chunkBibleVerses(verses), [verses]);
  const totalPages = pages.length;
  const pageVerses = pages[currentPage - 1] ?? [];
  const isLastPage = currentPage >= totalPages;

  useEffect(() => {
    if (open) setCurrentPage(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowLeft') {
        setCurrentPage((page) => Math.max(1, page - 1));
        return;
      }

      if (e.key === 'ArrowRight') {
        setCurrentPage((page) => Math.min(totalPages, page + 1));
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
  }, [open, onClose, totalPages]);

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
          {loading ? (
            <p className="text-sm text-oliva/80">Carregando texto bíblico...</p>
          ) : pageVerses.length > 0 ? (
            <BibleVerseText verses={pageVerses} />
          ) : (
            <p className="text-sm text-oliva/80">{passage.preview}</p>
          )}

          {isLastPage && !loading && (
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

        {totalPages > 1 && !loading && (
          <div className="border-t border-borda px-5 py-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold text-oliva whitespace-nowrap">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="w-24 sm:w-32 h-1.5 bg-borda/60 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber to-laranja h-full rounded-full transition-all duration-500"
                    style={{ width: `${(currentPage / totalPages) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className="w-9 h-9 rounded-full border border-borda flex items-center justify-center text-oliva hover:text-laranja hover:border-laranja transition-all disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Próxima página"
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                    'bg-gradient-to-r from-amber to-laranja text-white shadow-livro',
                    'hover:from-amber/90 hover:to-laranja/90 disabled:opacity-30',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja'
                  )}
                >
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward_ios</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-borda px-5 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber to-laranja hover:from-amber/90 hover:to-laranja/90 font-bold text-xs text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
