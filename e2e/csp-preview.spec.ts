import { test, expect } from '@playwright/test';

type CspViolationRecord = {
  blockedURI: string;
  violatedDirective: string;
  effectiveDirective: string;
};

declare global {
  interface Window {
    __cspViolations: CspViolationRecord[];
    __cspInlineProbe?: boolean;
  }
}

function scriptSrcDirective(csp: string): string {
  return csp.split('; ').find((part) => part.startsWith('script-src')) ?? '';
}

test.describe('CSP preview policy (VERCEL_ENV=preview)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        window.__cspViolations.push({
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          effectiveDirective: event.effectiveDirective,
        });
      });
    });
  });

  test('allows server HTML inline scripts without nonce (Vercel Toolbar pattern)', async ({
    page,
  }) => {
    const response = await page.goto('/test/csp-fixture');
    expect(response?.ok()).toBe(true);

    const cspHeader = response?.headers()['content-security-policy'] ?? '';
    expect(scriptSrcDirective(cspHeader)).toBe(
      "script-src 'self' https://vercel.live https://vercel.com 'unsafe-inline'"
    );
    expect(scriptSrcDirective(cspHeader)).not.toContain('nonce-');
    expect(scriptSrcDirective(cspHeader)).not.toContain("'strict-dynamic'");

    await page.waitForTimeout(300);

    const inlineProbe = await page.evaluate(() => window.__cspInlineProbe);
    const violations = await page.evaluate(() => window.__cspViolations);

    expect(inlineProbe).toBe(true);

    const inlineViolations = violations.filter(
      (entry) =>
        entry.effectiveDirective.startsWith('script-src') &&
        (entry.blockedURI === '' || entry.blockedURI === 'inline')
    );
    expect(inlineViolations).toHaveLength(0);
  });
});
