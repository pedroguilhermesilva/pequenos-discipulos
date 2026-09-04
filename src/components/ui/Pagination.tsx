import { cn } from '@/lib/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
}

function getVisiblePages(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) pages.push('ellipsis');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) pages.push('ellipsis');

  pages.push(totalPages);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel = 'Paginação',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav aria-label={ariaLabel} className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Página anterior"
        className={cn(
          'inline-flex items-center justify-center w-10 h-10 rounded-livro border border-borda bg-white text-tinta transition-colors',
          'hover:border-vida/40 hover:bg-pergaminho-escuro',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-vida focus-visible:ring-offset-2',
          'disabled:opacity-40 disabled:pointer-events-none'
        )}
      >
        <span className="material-symbols-outlined text-xl">chevron_left</span>
      </button>

      <ul className="flex items-center gap-1 list-none p-0 m-0">
        {visiblePages.map((page, index) =>
          page === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} className="px-1 text-oliva select-none" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                onClick={() => onPageChange(page)}
                aria-label={`Página ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center justify-center min-w-[2.5rem] h-10 px-2 rounded-livro border font-bold text-sm transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-vida focus-visible:ring-offset-2',
                  page === currentPage
                    ? 'border-vida bg-vida text-white shadow-livro'
                    : 'border-borda bg-white text-tinta hover:border-vida/40 hover:bg-pergaminho-escuro'
                )}
              >
                {page}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Página seguinte"
        className={cn(
          'inline-flex items-center justify-center w-10 h-10 rounded-livro border border-borda bg-white text-tinta transition-colors',
          'hover:border-vida/40 hover:bg-pergaminho-escuro',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-vida focus-visible:ring-offset-2',
          'disabled:opacity-40 disabled:pointer-events-none'
        )}
      >
        <span className="material-symbols-outlined text-xl">chevron_right</span>
      </button>
    </nav>
  );
}
