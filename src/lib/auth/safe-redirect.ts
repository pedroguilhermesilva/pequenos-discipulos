/**
 * Allowlist for post-login redirects — only same-origin relative paths.
 */
export function sanitizeCallbackPath(value: string | null | undefined, fallback = '/home'): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  if (/^\/https?:/i.test(trimmed) || trimmed.includes('://')) {
    return fallback;
  }

  return trimmed;
}
