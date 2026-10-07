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

test.describe('CSP blocks untrusted scripts (production build)', () => {
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

  test('blocks external and inline scripts without nonce from server HTML', async ({
    page,
  }) => {
    const response = await page.goto('/test/csp-fixture');
    expect(response?.ok()).toBe(true);

    const cspHeader = response?.headers()['content-security-policy'] ?? '';
    expect(cspHeader).toContain("'strict-dynamic'");
    expect(cspHeader).toContain("'nonce-");
    expect(cspHeader).not.toMatch(/script-src[^;]*'unsafe-inline'/);

    await page.waitForTimeout(300);

    const violations = await page.evaluate(() => window.__cspViolations);
    const inlineProbe = await page.evaluate(() => window.__cspInlineProbe);

    expect(inlineProbe).toBeUndefined();

    const scriptViolations = violations.filter((entry) =>
      entry.effectiveDirective.startsWith('script-src')
    );

    expect(scriptViolations.length).toBeGreaterThanOrEqual(2);
    expect(
      scriptViolations.some((entry) => entry.blockedURI.includes('example.com/x.js'))
    ).toBe(true);
    expect(
      scriptViolations.some(
        (entry) => entry.blockedURI === '' || entry.blockedURI === 'inline'
      )
    ).toBe(true);
  });
});
