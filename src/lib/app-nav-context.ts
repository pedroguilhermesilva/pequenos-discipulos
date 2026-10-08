import 'server-only';

import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/db/prisma';

export type AppNavContext = {
  isAdmin: boolean;
  pendingManualReviewCount: number;
};

export async function getAppNavContext(): Promise<AppNavContext> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return { isAdmin: false, pendingManualReviewCount: 0 };
  }

  const pendingManualReviewCount = await prisma.passageAdaptation.count({
    where: { status: 'pending_manual_review' },
  });

  return { isAdmin: true, pendingManualReviewCount };
}
