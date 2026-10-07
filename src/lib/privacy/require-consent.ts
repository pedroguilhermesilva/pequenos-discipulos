import { CURRENT_CONSENT_VERSION } from '@/lib/privacy/constants';

export function userNeedsConsent(user: {
  consentAcceptedAt: Date | null;
  consentVersion: string | null;
}): boolean {
  return (
    user.consentAcceptedAt == null || user.consentVersion !== CURRENT_CONSENT_VERSION
  );
}

export const CONSENT_EXEMPT_PATHS = [
  '/consentimento',
  '/privacidade',
  '/termos',
  '/login',
  '/api/auth',
  '/api/account',
];

export function isConsentExemptPath(pathname: string): boolean {
  if (CONSENT_EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return false;
}
