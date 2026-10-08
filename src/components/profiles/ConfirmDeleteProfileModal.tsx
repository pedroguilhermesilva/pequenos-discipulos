'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

interface ConfirmDeleteProfileModalProps {
  open: boolean;
  profileName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteProfileModal({
  open,
  profileName,
  onClose,
  onConfirm,
}: ConfirmDeleteProfileModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-tinta/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-profile-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-livro shadow-livro-lg border border-borda p-6 md:p-8 animate-fade-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-600">delete_forever</span>
          </div>
          <div>
            <h2
              id="confirm-delete-profile-title"
              className="font-display text-xl font-bold text-tinta mb-2"
            >
              Excluir perfil de {profileName}?
            </h2>
            <p className="text-sm text-oliva leading-relaxed">
              As histórias, favoritos e coleções deste filho serão apagados. Esta ação não pode ser
              desfeita.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-borda text-tinta font-semibold text-sm rounded-livro hover:bg-pergaminho-escuro transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'px-5 py-2.5 bg-red-600 text-white font-bold text-sm rounded-livro',
              'hover:bg-red-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400'
            )}
          >
            Sim, excluir perfil
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
