import {
  getCurrentChildProfileId,
  requireCurrentUser,
} from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import type { FavoriteItem } from './types';

export async function getFavorites(): Promise<{ items: FavoriteItem[]; isDemo: boolean }> {
  const user = await requireCurrentUser();
  const childProfileId = (await getCurrentChildProfileId()) ?? undefined;
  const items = await container.services.favorites.list(user.id, childProfileId);
  return { items, isDemo: false };
}
