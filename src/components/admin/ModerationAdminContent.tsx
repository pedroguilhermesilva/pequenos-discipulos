'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

type PendingItem = {
  id: string;
  title: string;
  status: string;
  moderationReason: string | null;
  ageTier: string;
  passage: { reference: string; slug: string };
  createdByUser: { email: string | null; fullName: string | null } | null;
};

export function ModerationAdminContent() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/moderation');
      const json = (await response.json()) as {
        ok: boolean;
        data?: PendingItem[];
        message?: string;
      };
      if (!response.ok || !json.ok) {
        setError(json.message ?? 'Não foi possível carregar a fila.');
        setItems([]);
        return;
      }
      setItems(json.data ?? []);
    } catch {
      setError('Falha de rede ao carregar revisões.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: 'approve' | 'reject' | 'withdraw') => {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/moderation/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reasons[id] ?? undefined }),
      });
      const json = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !json.ok) {
        setError(json.message ?? 'Ação não concluída.');
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError('Falha de rede.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-livro border border-laranja/30 bg-laranja-suave px-4 py-3 text-sm text-tinta">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-oliva text-sm">Carregando fila de revisão...</p>
      ) : items.length === 0 ? (
        <div className="rounded-livro-xl border border-borda bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-aprovado mb-3">verified</span>
          <p className="font-display font-bold text-tinta">Nada pendente agora</p>
          <p className="text-sm text-oliva mt-1">
            Quando uma versão precisar de revisão manual, ela aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-livro-xl border border-borda bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-oliva">
                    Revisão manual
                  </p>
                  <h2 className="font-display text-lg font-bold text-tinta">{item.title}</h2>
                  <p className="text-sm text-oliva">
                    {item.passage.reference} · {item.ageTier.replace('TIER_', '').replace('_', ' a ')}{' '}
                    anos
                  </p>
                  {item.createdByUser?.email ? (
                    <p className="text-xs text-oliva/80">
                      Família: {item.createdByUser.fullName ?? item.createdByUser.email}
                    </p>
                  ) : null}
                  {item.moderationReason ? (
                    <p className="text-xs text-laranja mt-2">{item.moderationReason}</p>
                  ) : null}
                </div>
              </div>

              <label className="block text-xs font-semibold text-oliva">
                Motivo (opcional para aprovar; recomendado para recusar/retirar)
                <textarea
                  value={reasons[item.id] ?? ''}
                  onChange={(event) =>
                    setReasons((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-borda bg-pergaminho-escuro/40 px-3 py-2 text-sm text-tinta focus:border-laranja focus:ring-laranja"
                  placeholder="Ex.: Detalhes fortes demais para a idade."
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void runAction(item.id, 'approve')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold',
                    'bg-aprovado-claro text-aprovado border border-aprovado/20 hover:bg-aprovado/10',
                    'disabled:opacity-50'
                  )}
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Aprovar
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void runAction(item.id, 'reject')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold',
                    'bg-laranja-suave text-laranja border border-laranja/25 hover:bg-laranja-suave/80',
                    'disabled:opacity-50'
                  )}
                >
                  <span className="material-symbols-outlined text-base">block</span>
                  Recusar
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void runAction(item.id, 'withdraw')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold',
                    'text-oliva bg-pergaminho-escuro hover:bg-pergaminho-escuro/80 border border-borda',
                    'disabled:opacity-50'
                  )}
                >
                  <span className="material-symbols-outlined text-base">visibility_off</span>
                  Retirar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
