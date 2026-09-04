'use client';

import { useEffect, useMemo, useState } from 'react';
import { FavoriteItemCard } from '@/components/FavoriteItemCard';
import { FavoritesFilterEmptyState } from '@/components/FavoritesFilterEmptyState';
import { ChipToggle } from '@/components/ui/ChipToggle';
import { Pagination } from '@/components/ui/Pagination';
import { contentTypeConfig } from '@/lib/stories/content-type';
import {
  FAVORITES_PAGE_SIZE,
  filterFavorites,
  getTotalPages,
  paginateItems,
} from '@/lib/stories/favorite-filters';
import type { ContentType, FavoriteItem } from '@/lib/stories/types';

interface FavoritesListProps {
  items: FavoriteItem[];
}

const contentTypeFilters: Array<{ id: ContentType | 'all'; label: string; icon: string }> = [
  { id: 'all', label: 'Todos', icon: 'apps' },
  { id: 'text', label: contentTypeConfig.text.label, icon: contentTypeConfig.text.icon },
  { id: 'audio', label: contentTypeConfig.audio.label, icon: contentTypeConfig.audio.icon },
  { id: 'video', label: contentTypeConfig.video.label, icon: contentTypeConfig.video.icon },
];

export function FavoritesList({ items }: FavoritesListProps) {
  const [contentType, setContentType] = useState<ContentType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(
    () => filterFavorites(items, contentType),
    [items, contentType]
  );

  const totalPages = getTotalPages(filteredItems.length, FAVORITES_PAGE_SIZE);
  const paginatedItems = paginateItems(filteredItems, currentPage, FAVORITES_PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [contentType]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const hasActiveFilters = contentType !== 'all';

  function clearFilters() {
    setContentType('all');
  }

  const resultSummary =
    filteredItems.length === 1
      ? '1 favorito'
      : `${filteredItems.length} favoritos`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-livro border border-borda shadow-livro p-4 md:p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-oliva">Tipo de conteúdo</p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar por tipo de conteúdo"
        >
          {contentTypeFilters.map((filter) => (
            <ChipToggle
              key={filter.id}
              label={filter.label}
              icon={filter.icon}
              selected={contentType === filter.id}
              onClick={() => setContentType(filter.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-oliva" aria-live="polite">
          {resultSummary}
          {hasActiveFilters && filteredItems.length > 0 && (
            <span className="text-oliva/70">
              {' '}
              · página {currentPage} de {totalPages}
            </span>
          )}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-bold text-vida hover:text-vida/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida focus-visible:ring-offset-2 rounded"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <FavoritesFilterEmptyState onClearFilters={clearFilters} />
      ) : (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 list-none p-0 m-0">
            {paginatedItems.map((item) => (
              <li key={item.id} className="h-full">
                <FavoriteItemCard item={item} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                ariaLabel="Paginação dos favoritos"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
