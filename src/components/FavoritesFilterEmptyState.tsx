interface FavoritesFilterEmptyStateProps {
  onClearFilters: () => void;
}

export function FavoritesFilterEmptyState({ onClearFilters }: FavoritesFilterEmptyStateProps) {
  return (
    <div
      className="bg-white rounded-livro shadow-livro border border-borda p-10 md:p-12 flex flex-col items-center text-center gap-5"
      role="status"
    >
      <div className="w-16 h-16 rounded-full bg-pergaminho-escuro flex items-center justify-center">
        <span className="material-symbols-outlined text-oliva text-3xl">filter_list_off</span>
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-xl font-bold text-tinta">Nenhum resultado</h2>
        <p className="text-oliva leading-relaxed">
          Não encontrámos favoritos com este filtro. Experimente outro tipo de conteúdo.
        </p>
      </div>
      <button
        type="button"
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-laranja text-laranja font-bold text-sm rounded-livro hover:bg-laranja-suave transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2"
      >
        <span className="material-symbols-outlined text-base">filter_list</span>
        Limpar filtros
      </button>
    </div>
  );
}
