'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

interface ParentGateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function generateMathProblem() {
  const a = Math.floor(Math.random() * 8) + 3;
  const b = Math.floor(Math.random() * 8) + 3;
  return { a, b, answer: a * b };
}

export function ParentGateModal({ open, onClose, onSuccess }: ParentGateModalProps) {
  const [problem, setProblem] = useState(generateMathProblem);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setProblem(generateMathProblem());
    setAnswer('');
    setError(false);

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

  const handleVerify = () => {
    if (Number(answer) === problem.answer) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setProblem(generateMathProblem());
      setAnswer('');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-gate-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-tinta/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar desafio parental"
      />

      <div
        className="relative z-10 bg-white rounded-livro-xl max-w-md w-full p-6 shadow-2xl border border-borda space-y-4 animate-fade-in max-h-[min(90dvh,640px)] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-borda pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-dourado/15 text-dourado rounded-xl">
              <span className="material-symbols-outlined text-xl">shield</span>
            </div>
            <h3 id="parent-gate-title" className="font-display font-bold text-tinta">
              Desafio Parental
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-oliva hover:text-tinta transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="text-xs text-oliva">
          Para evitar acessos indesejados ou alterações feitas pelas crianças, resolva o cálculo
          abaixo:
        </p>

        <div className="bg-pergaminho-escuro p-4 rounded-livro text-center space-y-3">
          <span className="text-2xl font-display font-bold text-tinta">
            {problem.a} × {problem.b} = ?
          </span>
          <input
            type="number"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            placeholder="Sua resposta"
            className={cn(
              'w-full text-center py-2 px-3 bg-white border rounded-xl font-bold text-tinta focus:outline-none focus:ring-2 focus:ring-vida',
              error ? 'border-red-400' : 'border-borda'
            )}
            autoFocus
          />
          {error && (
            <p className="text-xs text-red-600 font-semibold">Resposta incorreta. Tente novamente.</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl border border-borda font-bold text-xs text-oliva hover:bg-pergaminho-escuro transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleVerify}
            className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber to-laranja hover:from-amber/90 hover:to-laranja/90 font-bold text-xs text-white transition-all"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
