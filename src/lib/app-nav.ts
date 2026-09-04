export type AppNavId = 'home' | 'library' | 'favorites' | 'settings' | 'help';

export interface AppNavItem {
  id: AppNavId;
  label: string;
  icon: string;
  href: string;
}

export const appNavItems: AppNavItem[] = [
  { id: 'home', label: 'Início', icon: 'home', href: '/home' },
  { id: 'library', label: 'Biblioteca', icon: 'library_books', href: '/biblioteca' },
  { id: 'favorites', label: 'Favoritos', icon: 'favorite', href: '/favoritos' },
  { id: 'settings', label: 'Configurações', icon: 'settings', href: '/configuracoes' },
  { id: 'help', label: 'Ajuda', icon: 'help', href: '/ajuda' },
];

export function getActiveNavId(pathname: string): AppNavId {
  if (pathname === '/home' || pathname === '/') return 'home';
  if (pathname === '/biblioteca' || pathname.startsWith('/stories/') || pathname === '/nova-historia') return 'library';
  if (pathname === '/favoritos') return 'favorites';
  if (pathname === '/configuracoes' || pathname === '/perfis') return 'settings';
  if (pathname === '/ajuda') return 'help';
  return 'home';
}
