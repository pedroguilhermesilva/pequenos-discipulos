import { describe, expect, it } from 'vitest';
import {
  applyContentSecurityPolicy,
  buildContentSecurityPolicy,
  generateCspNonce,
  STATIC_SECURITY_HEADERS,
} from '@/lib/security/csp';

const TEST_NONCE = 'dGVzdC1ub25jZQ==';

function styleSrcDirective(csp: string): string {
  return csp.split('; ').find((part) => part.startsWith('style-src')) ?? '';
}

function scriptSrcDirective(csp: string): string {
  return csp.split('; ').find((part) => part.startsWith('script-src')) ?? '';
}

describe('generateCspNonce', () => {
  it('returns a base64-encoded string', () => {
    const nonce = generateCspNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(nonce.length).toBeGreaterThan(10);
  });

  it('generates unique values per call', () => {
    const first = generateCspNonce();
    const second = generateCspNonce();
    expect(first).not.toBe(second);
  });
});

describe('buildContentSecurityPolicy', () => {
  it('builds a strict production policy with nonce and strict-dynamic', () => {
    const csp = buildContentSecurityPolicy({
      nonce: TEST_NONCE,
      isDev: false,
      isPreview: false,
    });

    expect(scriptSrcDirective(csp)).toBe(
      `script-src 'self' 'nonce-${TEST_NONCE}' 'strict-dynamic'`
    );
    expect(styleSrcDirective(csp)).toBe(
      "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'"
    );
    expect(styleSrcDirective(csp)).not.toContain('nonce-');
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("media-src 'self' blob:");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain('https://lh3.googleusercontent.com');
    expect(csp).toContain("form-action 'self' https://accounts.google.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).not.toContain('vercel.live');
  });

  it('allows unsafe-eval in development script-src only', () => {
    const csp = buildContentSecurityPolicy({
      nonce: TEST_NONCE,
      isDev: true,
      isPreview: false,
    });

    expect(scriptSrcDirective(csp)).toContain("'unsafe-eval'");
    expect(styleSrcDirective(csp)).toBe(
      "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'"
    );
    expect(styleSrcDirective(csp)).not.toContain('nonce-');
  });

  it('uses host allowlist for Vercel preview without strict-dynamic', () => {
    const csp = buildContentSecurityPolicy({
      nonce: TEST_NONCE,
      isDev: false,
      isPreview: true,
    });

    const scriptSrc = scriptSrcDirective(csp);
    expect(scriptSrc).toContain(`'nonce-${TEST_NONCE}'`);
    expect(scriptSrc).toContain('https://vercel.live');
    expect(scriptSrc).toContain('https://vercel.com');
    expect(scriptSrc).toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'strict-dynamic'");

    const styleSrc = styleSrcDirective(csp);
    expect(styleSrc).toContain("'unsafe-inline'");
    expect(styleSrc).toContain('https://vercel.live');
    expect(styleSrc).not.toContain('nonce-');

    expect(csp).toContain('https://vitals.vercel-insights.com');
    expect(csp).toContain('https://*.pusher.com');
    expect(csp).toContain('wss://*.pusher.com');
    expect(csp).toContain("frame-src 'self' https://vercel.live https://vercel.com");
  });
});

describe('applyContentSecurityPolicy', () => {
  it('sets matching CSP and x-nonce on request and response headers', () => {
    const requestHeaders = new Headers();
    const responseHeaders = new Headers();

    const csp = applyContentSecurityPolicy(requestHeaders, responseHeaders, {
      isDev: false,
      isPreview: false,
    });

    const nonce = requestHeaders.get('x-nonce');
    expect(nonce).toBeTruthy();
    expect(requestHeaders.get('Content-Security-Policy')).toBe(csp);
    expect(responseHeaders.get('Content-Security-Policy')).toBe(csp);
    expect(scriptSrcDirective(csp)).toContain(`'nonce-${nonce}'`);

    for (const { key, value } of STATIC_SECURITY_HEADERS) {
      expect(responseHeaders.get(key)).toBe(value);
    }
  });

  it('detects preview deployments via VERCEL_ENV', () => {
    const previous = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = 'preview';

    try {
      const requestHeaders = new Headers();
      const responseHeaders = new Headers();
      const csp = applyContentSecurityPolicy(requestHeaders, responseHeaders);
      expect(scriptSrcDirective(csp)).not.toContain("'strict-dynamic'");
      expect(scriptSrcDirective(csp)).toContain('https://vercel.live');
    } finally {
      if (previous === undefined) {
        delete process.env.VERCEL_ENV;
      } else {
        process.env.VERCEL_ENV = previous;
      }
    }
  });
});
