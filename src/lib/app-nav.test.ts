import { describe, expect, it } from 'vitest';
import { buildAppNavItems, getActiveNavId } from '@/lib/app-nav';

describe('buildAppNavItems', () => {
  it('does not include Moderação for non-admin users', () => {
    const items = buildAppNavItems({ isAdmin: false });
    expect(items.map((item) => item.id)).toEqual([
      'home',
      'library',
      'favorites',
      'settings',
      'help',
    ]);
  });

  it('includes Moderação after Configurações for admin users', () => {
    const items = buildAppNavItems({ isAdmin: true, pendingManualReviewCount: 2 });
    expect(items.map((item) => item.id)).toEqual([
      'home',
      'library',
      'favorites',
      'settings',
      'moderation',
      'help',
    ]);
    const moderation = items.find((item) => item.id === 'moderation');
    expect(moderation?.label).toBe('Moderação');
    expect(moderation?.icon).toBe('shield');
    expect(moderation?.href).toBe('/admin/moderacao');
    expect(moderation?.badgeCount).toBe(2);
  });

  it('omits badge when there is nothing pending review', () => {
    const items = buildAppNavItems({ isAdmin: true, pendingManualReviewCount: 0 });
    expect(items.find((item) => item.id === 'moderation')?.badgeCount).toBeUndefined();
  });
});

describe('getActiveNavId', () => {
  it('marks moderation route as active', () => {
    expect(getActiveNavId('/admin/moderacao')).toBe('moderation');
  });
});
