'use server';

import type { AgeTier } from '@prisma/client';
import { requireCurrentUser } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import type {
  CommunityBrowseFilters,
  CommunityBrowsePage,
  CommunityBrowseSort,
} from '@/lib/services/community-browse.service';

export async function browseCommunityAction(input: {
  search?: string;
  ageTier?: AgeTier | '';
  sort?: CommunityBrowseSort;
  page?: number;
}): Promise<{ ok: true; data: CommunityBrowsePage } | { ok: false; message: string }> {
  const filters: CommunityBrowseFilters = {
    search: input.search,
    ageTier: input.ageTier ? (input.ageTier as AgeTier) : undefined,
    sort: input.sort ?? 'votes',
    page: input.page ?? 0,
  };

  try {
    const user = await requireCurrentUser();
    const data = await container.services.communityBrowse.listForUser(user.id, filters);
    return { ok: true, data };
  } catch {
    return { ok: false, message: 'Não foi possível carregar a comunidade.' };
  }
}
