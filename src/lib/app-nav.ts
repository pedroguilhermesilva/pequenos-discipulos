export type AppNavId =
  | 'home'
  | 'library'
  | 'community'
  | 'favorites'
  | 'settings'
  | 'moderation'
  | 'help';

export interface AppNavItem {
  id: AppNavId;
  label: string;
  icon: string;
  href: string;
  badgeCount?: number;
}

const baseAppNavItems: AppNavItem[] = [
  { id: 'home', label: 'Início', icon: 'home', href: '/home' },
  { id: 'library', label: 'Biblioteca', icon: 'library_books', href: '/biblioteca' },
  { id: 'community', label: 'Comunidade', icon: 'groups', href: '/comunidade' },
  { id: 'favorites', label: 'Favoritos', icon: 'favorite', href: '/favoritos' },
  { id: 'settings', label: 'Configurações', icon: 'settings', href: '/configuracoes' },
  { id: 'help', label: 'Ajuda', icon: 'help', href: '/ajuda' },
];

const moderationNavItem: AppNavItem = {
  id: 'moderation',
  label: 'Moderação',
  icon: 'shield',
  href: '/admin/moderacao',
};

/** @deprecated Use buildAppNavItems for admin-aware navigation. */
export const appNavItems: AppNavItem[] = baseAppNavItems;

export function buildAppNavItems(options: {
  isAdmin: boolean;
  pendingManualReviewCount?: number;
}): AppNavItem[] {
  if (!options.isAdmin) {
    return baseAppNavItems;
  }

  const helpIndex = baseAppNavItems.findIndex((item) => item.id === 'help');
  const items = [...baseAppNavItems];
  items.splice(helpIndex, 0, {
    ...moderationNavItem,
    badgeCount:
      options.pendingManualReviewCount && options.pendingManualReviewCount > 0
        ? options.pendingManualReviewCount
        : undefined,
  });
  return items;
}

export function getActiveNavId(pathname: string): AppNavId {
  if (pathname === '/home' || pathname === '/') return 'home';
  if (
    pathname === '/biblioteca' ||
    pathname.startsWith('/stories/') ||
    pathname === '/nova-historia'
  ) {
    return 'library';
  }
  if (pathname === '/comunidade' || pathname.startsWith('/comunidade/')) {
    return 'community';
  }
  if (pathname === '/favoritos') return 'favorites';
  if (pathname === '/configuracoes' || pathname === '/perfis') return 'settings';
  if (pathname === '/admin/moderacao' || pathname.startsWith('/admin/moderacao')) {
    return 'moderation';
  }
  if (pathname === '/ajuda') return 'help';
  return 'home';
}
