import { AppShell } from '@/components/AppShell';
import { FavoritesEmptyState } from '@/components/FavoritesEmptyState';
import { FavoritesList } from '@/components/FavoritesList';
import { getFavorites } from '@/lib/stories/get-favorites';

export const metadata = {
  title: 'Favoritos — Pequenos Discípulos',
  description: 'Histórias, áudios e vídeos guardados para ler e ouvir outra vez.',
};

export default async function FavoritosPage() {
  const { items, isDemo } = await getFavorites();

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-vida text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta">Favoritos</h1>
          </div>
          <p className="text-oliva text-base md:text-lg max-w-2xl">
            Tudo o que guardou — histórias, áudios e vídeos — num só lugar para voltar quando
            quiser.
          </p>
          {isDemo && items.length > 0 && (
            <p className="text-xs text-oliva/80 bg-pergaminho-escuro border border-borda rounded-lg px-3 py-2 inline-block">
              A mostrar conteúdo de exemplo. Inicie sessão para ver os seus favoritos reais.
            </p>
          )}
        </header>

        {items.length === 0 ? <FavoritesEmptyState /> : <FavoritesList items={items} />}
      </div>
    </AppShell>
  );
}
