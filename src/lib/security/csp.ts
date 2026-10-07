import { randomUUID } from 'node:crypto';

export type ContentSecurityPolicyOptions = {
  nonce: string;
  isDev?: boolean;
  isPreview?: boolean;
};

export function generateCspNonce(): string {
  return Buffer.from(randomUUID()).toString('base64');
}

export function buildContentSecurityPolicy(
  options: ContentSecurityPolicyOptions
): string {
  const { nonce, isDev = false, isPreview = false } = options;

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    ...(isPreview ? ['https://vercel.live'] : []),
  ];

  const styleSrc = [
    "'self'",
    'https://fonts.googleapis.com',
    ...(isDev ? ["'unsafe-inline'"] : [`'nonce-${nonce}'`]),
    ...(isPreview
      ? ['https://vercel.live', 'https://vercel.com', "'unsafe-inline'"]
      : []),
  ];

  const connectSrc = [
    "'self'",
    ...(isPreview
      ? [
          'https://vercel.live',
          'https://vercel.com',
          'https://vitals.vercel-insights.com',
          'https://*.pusher.com',
          'wss://*.pusher.com',
        ]
      : []),
  ];

  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    'https://lh3.googleusercontent.com',
    ...(isPreview ? ['https://vercel.live', 'https://vercel.com'] : []),
  ];

  const fontSrc = [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
    ...(isPreview ? ['https://vercel.live', 'https://assets.vercel.com'] : []),
  ];

  const frameSrc = isPreview
    ? ["'self'", 'https://vercel.live', 'https://vercel.com']
    : ["'none'"];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `font-src ${fontSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    "media-src 'self' blob:",
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src ${frameSrc.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
  ];

  return directives.join('; ');
}

export const STATIC_SECURITY_HEADERS: ReadonlyArray<{
  key: string;
  value: string;
}> = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

export function applyStaticSecurityHeaders(headers: Headers): void {
  for (const { key, value } of STATIC_SECURITY_HEADERS) {
    headers.set(key, value);
  }
}

export function applyContentSecurityPolicy(
  requestHeaders: Headers,
  responseHeaders: Headers,
  options?: Omit<ContentSecurityPolicyOptions, 'nonce'>
): string {
  const nonce = generateCspNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    isDev: options?.isDev ?? process.env.NODE_ENV === 'development',
    isPreview: options?.isPreview ?? process.env.VERCEL_ENV === 'preview',
  });

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  responseHeaders.set('Content-Security-Policy', csp);
  applyStaticSecurityHeaders(responseHeaders);

  return csp;
}
