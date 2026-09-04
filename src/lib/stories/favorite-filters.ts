import type { ContentType, FavoriteItem } from './types';

export function filterFavorites(
  items: FavoriteItem[],
  contentType: ContentType | 'all'
): FavoriteItem[] {
  if (contentType === 'all') return items;
  return items.filter((item) => item.contentType === contentType);
}

export const FAVORITES_PAGE_SIZE = 9;

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getTotalPages(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}
