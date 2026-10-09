'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import type { AgeTier } from '@prisma/client';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { CommunityVersionCard } from '@/components/community/CommunityVersionCard';
import { browseCommunityAction } from '@/lib/community/actions';
import type { CommunityBrowseItem, CommunityBrowseSort } from '@/lib/services/community-browse.service';
import { cn } from '@/lib/cn';

const AGE_FILTER_OPTIONS: Array<{ value: '' | AgeTier; label: string }> = [
  { value: '', label: 'Todas as idades' },
  { value: 'TIER_3_5', label: '3 a 5 anos' },
  { value: 'TIER_6_8', label: '6 a 8 anos' },
  { value: 'TIER_9_11', label: '9 a 11 anos' },
];

export function CommunityPageContent() {
  const { activeProfile } = useChildProfiles();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ageTier, setAgeTier] = useState<'' | AgeTier>('');
  const [sort, setSort] = useState<CommunityBrowseSort>('votes');
  const [items, setItems] = useState<CommunityBrowseItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      const result = await browseCommunityAction({
        search: debouncedSearch || undefined,
        ageTier,
        sort,
        page: nextPage,
      });

      if (!result.ok) {
        setFeedback({ variant: 'error', message: result.message });
        return;
      }

      setItems((current) =>
        replace ? result.data.items : [...current, ...result.data.items]
      );
      setPage(result.data.page);
      setHasMore(result.data.hasMore);
    },
    [ageTier, debouncedSearch, sort]
  );

  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    startTransition(async () => {
      await loadPage(0, true);
      if (!cancelled) setInitialLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const handleLoadMore = () => {
    if (!hasMore || isPending) return;
    startTransition(async () => {
      await loadPage(page + 1, false);
    });
  };

  const childName = activeProfile?.preferences.childName ?? 'criança';

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <header className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta">Comunidade</h1>
        <p className="text-oliva text-lg max-w-2xl">
          Histórias aprovadas por famílias como a sua. Vote, leia e escolha a melhor versão para
          cada passagem.
        </p>
      </header>

      <div className="bg-white rounded-livro-xl border border-borda shadow-sm p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="lg:col-span-2 space-y-1">
            <span className="text-xs font-bold text-oliva">Buscar livro ou passagem</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex.: Mateus, Atos 2…"
              className="w-full rounded-xl border border-borda px-3 py-2.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-laranja"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold text-oliva">Faixa de idade</span>
            <select
              value={ageTier}
              onChange={(event) => setAgeTier(event.target.value as '' | AgeTier)}
              className="w-full rounded-xl border border-borda px-3 py-2.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-laranja bg-white"
            >
              {AGE_FILTER_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold text-oliva">Ordenar</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CommunityBrowseSort)}
              className="w-full rounded-xl border border-borda px-3 py-2.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-laranja bg-white"
            >
              <option value="votes">Mais votadas</option>
              <option value="recent">Mais recentes</option>
            </select>
          </label>
        </div>
      </div>

      {feedback ? (
        <p
          role="alert"
          className={cn(
            'text-sm rounded-xl px-4 py-3 border',
            feedback.variant === 'success'
              ? 'bg-aprovado-claro text-aprovado border-aprovado/20'
              : 'bg-red-50 text-red-700 border-red-200'
          )}
        >
          {feedback.message}
        </p>
      ) : null}

      {initialLoading ? (
        <p className="text-oliva text-sm">Carregando versões da comunidade…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-livro-xl border border-borda">
          <span className="material-symbols-outlined text-5xl text-oliva/40 mb-3">groups</span>
          <h2 className="font-display text-xl font-bold text-tinta mb-2">
            Ainda não há versões publicadas
          </h2>
          <p className="text-oliva text-sm max-w-md mx-auto">
            Quando famílias compartilharem histórias aprovadas, elas aparecerão aqui. Tente outra
            busca ou volte mais tarde.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <CommunityVersionCard
                key={item.id}
                item={item}
                childName={childName}
                childProfileId={activeProfile?.id}
                onFeedback={(message, variant) => setFeedback({ message, variant })}
                onItemChange={(id, patch) =>
                  setItems((current) =>
                    current.map((row) => (row.id === id ? { ...row, ...patch } : row))
                  )
                }
                onRemove={(id) => setItems((current) => current.filter((row) => row.id !== id))}
              />
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleLoadMore}
                className="px-6 py-3 rounded-xl bg-pergaminho-escuro hover:bg-pergaminho-escuro/80 text-tinta text-sm font-bold border border-borda transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
              >
                {isPending ? 'Carregando…' : 'Carregar mais'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
