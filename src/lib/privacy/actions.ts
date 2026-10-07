'use server';

import { revalidatePath } from 'next/cache';
import { requireCurrentUser } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { toActionError } from '@/lib/domain/errors';
import { CURRENT_CONSENT_VERSION } from '@/lib/privacy/constants';

export type PrivacyActionResult = {
  success: boolean;
  error?: string;
};

export async function acceptConsentAction(): Promise<PrivacyActionResult> {
  try {
    const user = await requireCurrentUser();
    await container.services.userData.recordConsent(user.id, CURRENT_CONSENT_VERSION);
    revalidatePath('/consentimento');
    revalidatePath('/home');
    return { success: true };
  } catch (error) {
    const result = toActionError(error);
    return { success: false, error: result.ok ? undefined : result.message };
  }
}

export async function deleteAccountAction(confirmation: string): Promise<PrivacyActionResult> {
  const normalized = confirmation.trim().toUpperCase();
  if (normalized !== 'EXCLUIR MINHA CONTA') {
    return {
      success: false,
      error: 'Digite exatamente "EXCLUIR MINHA CONTA" para confirmar.',
    };
  }

  try {
    const user = await requireCurrentUser();
    await container.services.userData.deleteAccount(user.id);
    return { success: true };
  } catch (error) {
    const result = toActionError(error);
    return { success: false, error: result.ok ? undefined : result.message };
  }
}
