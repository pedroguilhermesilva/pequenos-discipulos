import Link from 'next/link';

export function FavoritesEmptyState() {
  return (
    <div className="bg-white rounded-livro shadow-livro border border-borda p-10 md:p-16 flex flex-col items-center text-center gap-6 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-pergaminho-escuro flex items-center justify-center">
        <span
          className="material-symbols-outlined text-oliva text-4xl"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          favorite
        </span>
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-2xl font-bold text-tinta">Nenhum favorito ainda</h2>
        <p className="text-oliva leading-relaxed">
          Quando guardar uma história, áudio ou vídeo, ele aparece aqui para encontrar de novo com
          facilidade.
        </p>
      </div>
      <Link
        href="/biblioteca"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber to-laranja text-white font-bold text-sm rounded-livro shadow-livro hover:from-amber/90 hover:to-laranja/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2"
      >
        <span className="material-symbols-outlined text-base">library_books</span>
        Ir para a Biblioteca
      </Link>
    </div>
  );
}
