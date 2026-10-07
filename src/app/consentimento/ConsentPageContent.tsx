'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LegalFooterLinks } from '@/components/legal/LegalFooterLinks';
import { acceptConsentAction } from '@/lib/privacy/actions';
import { sanitizeCallbackPath } from '@/lib/auth/safe-redirect-client';
import { LEGAL_DRAFT_NOTICE } from '@/lib/privacy/constants';

export function ConsentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackPath(searchParams.get('callbackUrl'), '/home');

  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    if (!accepted) {
      setError('Marque a caixa para continuar.');
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await acceptConsentAction();
      if (!result.success) {
        setError(result.error ?? 'Não foi possível registrar o consentimento.');
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex flex-col">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full animate-fade-in">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-block mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
            >
              <Logo size="lg" />
            </Link>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-tinta mb-2">
              Antes de continuar
            </h1>
            <p className="text-oliva">
              Como responsável pela conta, confirme que leu e aceita nossos documentos legais.
            </p>
          </div>

          <div
            role="note"
            className="mb-6 rounded-livro border border-dourado/40 bg-dourado/10 px-4 py-3 text-sm text-tinta"
          >
            {LEGAL_DRAFT_NOTICE}
          </div>

          <div className="bg-white rounded-livro-xl shadow-livro-lg border border-borda p-6 md:p-8 space-y-6">
            <ul className="space-y-3 text-sm text-oliva">
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-vida shrink-0">child_care</span>
                <span>
                  Coletamos apenas o mínimo: apelido e faixa etária da criança, além dos dados da
                  sua conta.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-vida shrink-0">shield</span>
                <span>
                  O apelido da criança <strong className="text-tinta">nunca</strong> vai para
                  serviços de IA ou voz.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-vida shrink-0">download</span>
                <span>
                  Você pode exportar ou excluir seus dados a qualquer momento nas Configurações.
                </span>
              </li>
            </ul>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  if (e.target.checked) setError('');
                }}
                className="mt-1 h-4 w-4 rounded border-borda text-vida focus:ring-vida"
              />
              <span className="text-sm text-tinta leading-relaxed">
                Li e aceito a{' '}
                <Link href="/privacidade" target="_blank" className="text-vida font-semibold hover:underline">
                  Política de Privacidade
                </Link>{' '}
                e os{' '}
                <Link href="/termos" target="_blank" className="text-vida font-semibold hover:underline">
                  Termos de Uso
                </Link>
                , em nome dos menores sob minha responsabilidade.
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <PrimaryButton
              type="button"
              onClick={handleAccept}
              disabled={isPending}
              fullWidth
              className="h-12"
            >
              {isPending ? 'Registrando…' : 'Aceitar e continuar'}
            </PrimaryButton>
          </div>
        </div>
      </main>

      <footer className="py-6 px-6 flex flex-col items-center gap-2 text-oliva/70 text-sm">
        <LegalFooterLinks />
        <p>© {new Date().getFullYear()} Pequenos Discípulos</p>
      </footer>
    </div>
  );
}
