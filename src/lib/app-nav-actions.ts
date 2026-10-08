'use server';

import { getAppNavContext, type AppNavContext } from '@/lib/app-nav-context';

export async function getAppNavContextAction(): Promise<AppNavContext> {
  return getAppNavContext();
}
