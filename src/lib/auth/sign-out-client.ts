import { signOut } from 'next-auth/react';
import { clearLocalSession } from '@/lib/profiles/storage';

/**
 * Ends the NextAuth session and clears client-side profile/onboarding data.
 * Must run inside a component tree wrapped by SessionProvider.
 */
export async function performClientSignOut(callbackUrl = '/login'): Promise<void> {
  clearLocalSession();
  await signOut({ callbackUrl });
}
