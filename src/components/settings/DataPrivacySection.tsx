'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { deleteAccountAction } from '@/lib/privacy/actions';
import { performClientSignOut } from '@/lib/auth/sign-out-client';

interface DataPrivacySectionProps {
  isDemo: boolean;
}

export function DataPrivacySection({ isDemo }: DataPrivacySectionProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (isDemo) {
      setError('Inicie sessão para exportar os dados reais da conta.');
      return;
    }

    setError(null);
    setMessage(null);
    setExporting(true);

    try {
      const response = await fetch('/api/account/export');
      if (!response.ok) {
        const json = (await response.json()) as { message?: string };
        setError(json.message ?? 'Não foi possível exportar os dados.');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `pequenos-discipulos-dados-${Date.now()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('Download iniciado. Verifique a pasta de downloads.');
    } catch {
      setError('Erro de rede ao exportar. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = () => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      if (isDemo) {
        setError('Inicie sessão para excluir a conta.');
        return;
      }

      const result = await deleteAccountAction(confirmation);
      if (!result.success) {
        setError(result.error ?? 'Não foi possível excluir a conta.');
        return;
      }

      await performClientSignOut('/');
      router.push('/');
      router.refresh();
    });
  };

  return (
    <SettingsSection
      id="privacidade"
      title="Privacidade e dados"
      description="Exporte uma cópia dos seus dados ou exclua permanentemente a conta da família."
      icon="policy"
    >
      <div className="space-y-6">
        {(message || error) && (
          <div
            role="status"
            className={`rounded-livro border px-4 py-3 text-sm font-medium ${
              error
                ? 'bg-dourado/10 border-dourado/30 text-tinta'
                : 'bg-laranja/10 border-laranja/20 text-laranja'
            }`}
          >
            {error ?? message}
          </div>
        )}

        <div className="p-4 rounded-livro bg-pergaminho/60 border border-borda space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-vida shrink-0">download</span>
            <div className="flex-1">
              <p className="font-display font-bold text-tinta text-sm">Exportar meus dados</p>
              <p className="text-xs text-oliva mt-0.5">
                Baixa um arquivo JSON com conta, perfis, histórico de leitura, votos e coleções —
                apenas os seus.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || isPending}
              className="shrink-0 px-4 py-2 border border-vida text-vida font-semibold text-xs rounded-lg hover:bg-vida/5 transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-vida"
            >
              {exporting ? 'Preparando…' : 'Baixar JSON'}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-livro border border-red-200 bg-red-50/50 space-y-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 shrink-0">delete_forever</span>
            <div>
              <p className="font-display font-bold text-tinta text-sm">Excluir conta</p>
              <p className="text-xs text-oliva mt-1 leading-relaxed">
                Remove permanentemente sua conta, perfis das crianças, histórico, votos, coleções e
                áudios privados. Adaptações que você compartilhou com a comunidade permanecem
                disponíveis de forma anônima.
              </p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(true);
                setConfirmation('');
                setError(null);
                setMessage(null);
              }}
              className="text-xs font-bold text-red-700 hover:text-red-800 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              Quero excluir minha conta
            </button>
          ) : (
            <div className="space-y-3 pt-2 border-t border-red-200">
              <p className="text-xs text-tinta font-medium">
                Esta ação é irreversível. Digite{' '}
                <strong className="font-mono">EXCLUIR MINHA CONTA</strong> para confirmar:
              </p>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full h-10 rounded-livro border border-red-200 bg-white text-tinta px-3 text-sm font-mono focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                autoComplete="off"
                aria-label="Confirmação de exclusão"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending || confirmation.trim().toUpperCase() !== 'EXCLUIR MINHA CONTA'}
                  className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {isPending ? 'Excluindo…' : 'Confirmar exclusão'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmation('');
                  }}
                  className="px-4 py-2 border border-borda text-tinta font-semibold text-xs rounded-lg hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}
